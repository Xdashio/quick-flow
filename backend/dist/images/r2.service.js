"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var R2Service_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.R2Service = exports.ALLOWED_IMAGE_MIMES = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const crypto_1 = require("crypto");
const path = __importStar(require("path"));
exports.ALLOWED_IMAGE_MIMES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
]);
let R2Service = R2Service_1 = class R2Service {
    config;
    logger = new common_1.Logger(R2Service_1.name);
    s3;
    bucket;
    publicUrl;
    accountId;
    accessKeyId;
    secretAccessKey;
    constructor(config) {
        this.config = config;
        this.accountId = (this.config.get('R2_ACCOUNT_ID', '') ?? '').trim();
        this.accessKeyId = (this.config.get('R2_ACCESS_KEY_ID', '') ?? '').trim();
        this.secretAccessKey = (this.config.get('R2_SECRET_ACCESS_KEY', '') ?? '').trim();
        this.bucket = (this.config.get('R2_BUCKET', 'pos-product-images') ?? '').trim() || 'pos-product-images';
        this.publicUrl = (this.config.get('R2_PUBLIC_URL', '') ?? '').replace(/\/$/, '');
        if (!this.isConfigured()) {
            this.logger.warn('R2 storage is not fully configured (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET / R2_PUBLIC_URL). ' +
                'Image uploads will return 503 until these are set. Seeded external-URL images still resolve via publicUrlFor().');
        }
        this.s3 = new client_s3_1.S3Client({
            region: 'auto',
            endpoint: `https://${this.accountId || 'missing-account-id'}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: this.accessKeyId || 'missing',
                secretAccessKey: this.secretAccessKey || 'missing',
            },
            requestChecksumCalculation: 'WHEN_REQUIRED',
        });
    }
    isConfigured() {
        return Boolean(this.accountId && this.accessKeyId && this.secretAccessKey && this.bucket);
    }
    assertConfigured() {
        if (!this.isConfigured()) {
            throw new common_1.ServiceUnavailableException('Image storage is not configured on the server (missing R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY). ' +
                'Set them in backend/.env (local) and in the Railway/hosting env vars (production), then restart the backend.');
        }
    }
    async createPresignedUploadUrl(productId, originalFilename, contentType) {
        this.assertConfigured();
        const ext = path.extname(originalFilename).toLowerCase() || '.jpg';
        const key = `products/${productId}/${(0, crypto_1.randomUUID)()}${ext}`;
        const resolvedType = contentType && exports.ALLOWED_IMAGE_MIMES.has(contentType) ? contentType : this.mimeFromExt(ext);
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: resolvedType,
            ContentLength: undefined,
        });
        const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3, command, { expiresIn: 300 });
        this.logger.debug(`Pre-signed upload URL generated for key=${key} contentType=${resolvedType}`);
        return { uploadUrl, key, contentType: resolvedType };
    }
    async deleteObject(key) {
        if (!key)
            return;
        if (key.startsWith('http://') || key.startsWith('https://'))
            return;
        if (!this.isConfigured()) {
            this.logger.warn(`Skipping R2 delete for key=${key}: storage not configured`);
            return;
        }
        try {
            await this.s3.send(new client_s3_1.DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
            this.logger.debug(`Deleted R2 object key=${key}`);
        }
        catch (err) {
            this.logger.warn(`Failed to delete R2 object key=${key}: ${err.message}`);
        }
    }
    publicUrlFor(key) {
        if (!key)
            return null;
        const trimmed = key.trim();
        if (!trimmed)
            return null;
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://'))
            return trimmed;
        if (!this.publicUrl)
            return null;
        return `${this.publicUrl}/${trimmed.replace(/^\/+/, '')}`;
    }
    mimeFromExt(ext) {
        const map = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.gif': 'image/gif',
            '.avif': 'image/avif',
        };
        return map[ext] ?? 'application/octet-stream';
    }
};
exports.R2Service = R2Service;
exports.R2Service = R2Service = R2Service_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], R2Service);
//# sourceMappingURL=r2.service.js.map
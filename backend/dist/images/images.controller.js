"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImagesController = void 0;
const common_1 = require("@nestjs/common");
const r2_service_1 = require("./r2.service");
const prisma_service_1 = require("../prisma/prisma.service");
const presign_upload_dto_1 = require("./dto/presign-upload.dto");
const common_2 = require("@nestjs/common");
let ImagesController = class ImagesController {
    r2;
    prisma;
    constructor(r2, prisma) {
        this.r2 = r2;
        this.prisma = prisma;
    }
    async presignUpload(productId, dto) {
        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        if (!product)
            throw new common_2.NotFoundException(`Product ${productId} not found`);
        const { uploadUrl, key, contentType } = await this.r2.createPresignedUploadUrl(productId, dto.filename, dto.contentType);
        return {
            uploadUrl,
            key,
            contentType,
            imageUrl: this.r2.publicUrlFor(key),
        };
    }
    async removeImage(productId) {
        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        if (!product)
            throw new common_2.NotFoundException(`Product ${productId} not found`);
        if (product.imageKey) {
            await this.r2.deleteObject(product.imageKey);
        }
        await this.prisma.product.update({
            where: { id: productId },
            data: { imageKey: null },
        });
        return { deleted: true, productId };
    }
};
exports.ImagesController = ImagesController;
__decorate([
    (0, common_1.Post)('presign'),
    __param(0, (0, common_1.Param)('productId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, presign_upload_dto_1.PresignUploadDto]),
    __metadata("design:returntype", Promise)
], ImagesController.prototype, "presignUpload", null);
__decorate([
    (0, common_1.Delete)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('productId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ImagesController.prototype, "removeImage", null);
exports.ImagesController = ImagesController = __decorate([
    (0, common_1.Controller)('products/:productId/image'),
    __metadata("design:paramtypes", [r2_service_1.R2Service,
        prisma_service_1.PrismaService])
], ImagesController);
//# sourceMappingURL=images.controller.js.map
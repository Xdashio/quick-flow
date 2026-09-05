import { ConfigService } from '@nestjs/config';
export declare const ALLOWED_IMAGE_MIMES: Set<string>;
export declare class R2Service {
    private config;
    private readonly logger;
    private readonly s3;
    private readonly bucket;
    private readonly publicUrl;
    private readonly accountId;
    private readonly accessKeyId;
    private readonly secretAccessKey;
    constructor(config: ConfigService);
    isConfigured(): boolean;
    assertConfigured(): void;
    createPresignedUploadUrl(productId: string, originalFilename: string, contentType?: string): Promise<{
        uploadUrl: string;
        key: string;
        contentType: string;
    }>;
    deleteObject(key: string): Promise<void>;
    publicUrlFor(key: string | null | undefined): string | null;
    private mimeFromExt;
}

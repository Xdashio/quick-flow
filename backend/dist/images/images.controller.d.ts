import { R2Service } from './r2.service';
import { PrismaService } from '../prisma/prisma.service';
import { PresignUploadDto } from './dto/presign-upload.dto';
export declare class ImagesController {
    private readonly r2;
    private readonly prisma;
    constructor(r2: R2Service, prisma: PrismaService);
    presignUpload(productId: string, dto: PresignUploadDto): Promise<{
        uploadUrl: string;
        key: string;
        contentType: string;
        imageUrl: string | null;
    }>;
    removeImage(productId: string): Promise<{
        deleted: boolean;
        productId: string;
    }>;
}

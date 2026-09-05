/**
 * ImagesController
 *
 * POST /products/:id/image/presign
 *   → Returns a pre-signed R2 upload URL + the resulting object key.
 *   → Dashboard browser PUTs the file directly to R2.
 *   → On success, dashboard calls PATCH /products/:id with { imageKey }.
 *
 * DELETE /products/:id/image
 *   → Removes the image key from the product row and deletes the R2 object.
 */
import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { R2Service } from './r2.service';
import { PrismaService } from '../prisma/prisma.service';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { NotFoundException } from '@nestjs/common';

@Controller('products/:productId/image')
export class ImagesController {
  constructor(
    private readonly r2: R2Service,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Step 1 of the upload flow:
   *   Dashboard requests a pre-signed URL for a specific product + filename.
   *   The backend validates the product exists, generates the URL, and returns it.
   *   The browser then PUTs the file directly to R2 without touching this server again.
   *   After the PUT succeeds the dashboard calls PATCH /products/:id { imageKey }.
   */
  @Post('presign')
  async presignUpload(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: PresignUploadDto,
  ) {
    // Verify product exists
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);

    // NOTE: only uploadUrl/key/imageUrl/contentType leave the server —
    // R2_ACCOUNT_ID and API secrets are never serialized to the client.
    const { uploadUrl, key, contentType } = await this.r2.createPresignedUploadUrl(
      productId,
      dto.filename,
      dto.contentType,
    );

    return {
      uploadUrl,
      key,
      contentType,
      // Convenience: the URL the image will be accessible at once uploaded
      imageUrl: this.r2.publicUrlFor(key),
    };
  }

  /**
   * Removes the product's image — clears imageKey on the DB row and
   * deletes the object from R2.
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  async removeImage(@Param('productId', ParseUUIDPipe) productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);

    if (product.imageKey) {
      await this.r2.deleteObject(product.imageKey);
    }

    await this.prisma.product.update({
      where: { id: productId },
      data: { imageKey: null },
    });

    return { deleted: true, productId };
  }
}
/**
 * R2Service
 *
 * Thin wrapper around the S3-compatible Cloudflare R2 API.
 * Uses only the AWS SDK v3 S3Client (S3-compatible) — no Cloudflare-specific SDK needed.
 *
 * Required env vars:
 *   R2_ACCOUNT_ID      – Cloudflare account ID
 *   R2_ACCESS_KEY_ID   – R2 API token access key
 *   R2_SECRET_ACCESS_KEY – R2 API token secret
 *   R2_BUCKET          – bucket name
 *   R2_PUBLIC_URL      – CDN / public bucket URL (e.g. https://images.yourdomain.com)
 *                        No trailing slash.
 *
 * The bucket should be configured as public (or behind Cloudflare CDN with public read).
 * Pre-signed upload URLs allow the browser to PUT directly to R2 — the backend
 * never proxies the file bytes.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import * as path from 'path';

@Injectable()
export class R2Service {
  private readonly logger = new Logger(R2Service.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private config: ConfigService) {
    const accountId = this.config.get<string>('R2_ACCOUNT_ID', '');
    this.bucket = this.config.get<string>('R2_BUCKET', 'pos-product-images');
    this.publicUrl = this.config
      .get<string>('R2_PUBLIC_URL', '')
      .replace(/\/$/, ''); // strip trailing slash

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.get<string>('R2_ACCESS_KEY_ID', ''),
        secretAccessKey: this.config.get<string>('R2_SECRET_ACCESS_KEY', ''),
      },
    });
  }

  /**
   * Generate a pre-signed URL the browser can PUT to directly.
   * Returns both the upload URL and the resulting object key.
   * Expires in 5 minutes — enough for a dashboard product-edit flow.
   */
  async createPresignedUploadUrl(
    productId: string,
    originalFilename: string,
  ): Promise<{ uploadUrl: string; key: string }> {
    const ext = path.extname(originalFilename).toLowerCase() || '.jpg';
    const key = `products/${productId}/${randomUUID()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: this.mimeFromExt(ext),
      // 4 MB max — product thumbnails don't need to be larger
      ContentLength: undefined,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 });

    this.logger.debug(`Pre-signed upload URL generated for key=${key}`);
    return { uploadUrl, key };
  }

  /**
   * Delete an object by key. Called when a product image is replaced or
   * the product is deleted, so orphaned objects don't accumulate.
   */
  async deleteObject(key: string): Promise<void> {
    try {
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
      this.logger.debug(`Deleted R2 object key=${key}`);
    } catch (err) {
      // Log but don't throw — stale objects are preferable to a broken product update.
      this.logger.warn(`Failed to delete R2 object key=${key}: ${(err as Error).message}`);
    }
  }

  /**
   * Construct the public CDN URL for an image key.
   * e.g. key="products/abc/img.jpg" → "https://images.example.com/products/abc/img.jpg"
   *
   * If the key is already a full URL (e.g. from Unsplash / external CDN seeding),
   * it is returned as-is without prepending the R2 public URL.
   */
  publicUrlFor(key: string | null | undefined): string | null {
    if (!key) return null;
    // Already a full URL — return as-is (handles seeded Unsplash URLs etc.)
    if (key.startsWith('http://') || key.startsWith('https://')) return key;
    if (!this.publicUrl) return null;
    return `${this.publicUrl}/${key}`;
  }

  private mimeFromExt(ext: string): string {
    const map: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.avif': 'image/avif',
    };
    return map[ext] ?? 'application/octet-stream';
  }
}
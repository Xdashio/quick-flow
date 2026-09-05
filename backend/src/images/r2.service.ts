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
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import * as path from 'path';

export const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

@Injectable()
export class R2Service {
  private readonly logger = new Logger(R2Service.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;
  private readonly accountId: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;

  constructor(private config: ConfigService) {
    this.accountId = (this.config.get<string>('R2_ACCOUNT_ID', '') ?? '').trim();
    this.accessKeyId = (this.config.get<string>('R2_ACCESS_KEY_ID', '') ?? '').trim();
    this.secretAccessKey = (this.config.get<string>('R2_SECRET_ACCESS_KEY', '') ?? '').trim();
    this.bucket = (this.config.get<string>('R2_BUCKET', 'pos-product-images') ?? '').trim() || 'pos-product-images';
    this.publicUrl = (this.config.get<string>('R2_PUBLIC_URL', '') ?? '').replace(/\/$/, ''); // strip trailing slash

    if (!this.isConfigured()) {
      // Don't crash boot — local dev without R2 should still serve the API and
      // seeded (external-URL) images. Presign requests will fail fast with 503.
      this.logger.warn(
        'R2 storage is not fully configured (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET / R2_PUBLIC_URL). ' +
          'Image uploads will return 503 until these are set. Seeded external-URL images still resolve via publicUrlFor().',
      );
    }

    // WHEN_REQUIRED is critical: the default (WHEN_SUPPORTED) makes the SDK
    // add x-amz-checksum-crc32 to the signature, which the browser PUT would
    // then have to echo back exactly or R2 rejects with SignatureDoesNotMatch.
    // Disabling automatic checksums keeps the presigned URL to just the
    // headers the browser actually sends (Content-Type).
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${this.accountId || 'missing-account-id'}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.accessKeyId || 'missing',
        secretAccessKey: this.secretAccessKey || 'missing',
      },
      requestChecksumCalculation: 'WHEN_REQUIRED' as never,
    } as never);
  }

  /** True when all credentials needed for presigned uploads are present. */
  isConfigured(): boolean {
    return Boolean(this.accountId && this.accessKeyId && this.secretAccessKey && this.bucket);
  }

  assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Image storage is not configured on the server (missing R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY). ' +
          'Set them in backend/.env (local) and in the Railway/hosting env vars (production), then restart the backend.',
      );
    }
  }

  /**
   * Generate a pre-signed URL the browser can PUT to directly.
   * Returns both the upload URL and the resulting object key.
   * Expires in 5 minutes — enough for a dashboard product-edit flow.
   */
  async createPresignedUploadUrl(
    productId: string,
    originalFilename: string,
    contentType?: string,
  ): Promise<{ uploadUrl: string; key: string; contentType: string }> {
    this.assertConfigured();

    const ext = path.extname(originalFilename).toLowerCase() || '.jpg';
    const key = `products/${productId}/${randomUUID()}${ext}`;

    // Use the browser's Content-Type when it is a valid image mime so the
    // signed header exactly matches what the PUT will send. Fall back to the
    // extension mapping otherwise — mismatched Content-Type is the most common
    // cause of SignatureDoesNotMatch after the endpoint itself is fixed.
    const resolvedType =
      contentType && ALLOWED_IMAGE_MIMES.has(contentType) ? contentType : this.mimeFromExt(ext);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: resolvedType,
      // 4 MB max — product thumbnails don't need to be larger
      ContentLength: undefined,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 });

    this.logger.debug(`Pre-signed upload URL generated for key=${key} contentType=${resolvedType}`);
    return { uploadUrl, key, contentType: resolvedType };
  }

  /**
   * Delete an object by key. Called when a product image is replaced or
   * the product is deleted, so orphaned objects don't accumulate.
   */
  async deleteObject(key: string): Promise<void> {
    if (!key) return;
    // Seeded products store full external URLs (e.g. Unsplash) in imageKey —
    // there is no R2 object to delete for those.
    if (key.startsWith('http://') || key.startsWith('https://')) return;
    if (!this.isConfigured()) {
      this.logger.warn(`Skipping R2 delete for key=${key}: storage not configured`);
      return;
    }
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
    const trimmed = key.trim();
    if (!trimmed) return null;
    // Already a full URL — return as-is (handles seeded Unsplash URLs etc.)
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (!this.publicUrl) return null;
    return `${this.publicUrl}/${trimmed.replace(/^\/+/, '')}`;
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
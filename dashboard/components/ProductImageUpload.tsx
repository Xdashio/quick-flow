'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const ACCEPTED_EXT = /\.(jpg|jpeg|png|webp|gif|avif)$/i;

// Mirrors the backend's expectation (see r2.service.ts): product thumbnails
// don't need to be larger, and pre-signed PUTs can't enforce size — so the
// dashboard checks before requesting a URL.
const MAX_FILE_BYTES = 4 * 1024 * 1024;

interface Props {
  productId: string;
  productName: string;
  imageUrl: string | null;
}

export function ProductImageUpload({ productId, productName, imageUrl }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');

  const displayUrl = preview ?? imageUrl;

  async function handleFileSelected(file: File) {
    setError('');

    if (!ACCEPTED_EXT.test(file.name)) {
      setError('Use jpg, png, webp, gif, or avif');
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setError('Image must be 4 MB or smaller');
      return;
    }

    setUploading(true);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      // 1. Ask the backend for a pre-signed R2 upload URL (filename-only body
      // works on both the deployed backend and the updated one).
      const presignRes = await fetch(
        `/api/proxy/products/${productId}/image/presign`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ filename: file.name }),
        },
      );

      if (!presignRes.ok) {
        const data = await presignRes.json().catch(() => ({} as { message?: unknown }));
        if (presignRes.status === 503) {
          throw new Error('Image storage is not configured on the server. Set R2 env vars (backend/.env locally, hosting env vars in prod) and restart the backend.');
        }
        const msg = typeof data.message === 'string' ? data.message : 'Failed to get upload URL';
        throw new Error(msg);
      }

      const { uploadUrl, key, contentType } = await presignRes.json();

      // 2. PUT the file directly to R2 — Content-Type must match the signed header exactly
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      const mimeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.avif': 'image/avif',
      };
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType || mimeMap[ext] || file.type || 'application/octet-stream' },
        body: file,
      });

      if (!putRes.ok) {
        throw new Error('Upload to storage failed');
      }

      // 3. Persist the new imageKey on the product
      const patchRes = await fetch(`/api/proxy/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ imageKey: key }),
      });

      if (!patchRes.ok) {
        const data = await patchRes.json().catch(() => ({}));
        throw new Error(data.message ?? 'Failed to save image');
      }

      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
      setPreview(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleRemove() {
    setError('');
    setRemoving(true);
    try {
      const res = await fetch(`/api/proxy/products/${productId}/image`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? 'Failed to remove image');
      }
      setPreview(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove image');
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          flexShrink: 0,
          backgroundColor: 'var(--bg-surface-subtle)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayUrl}
            alt={productName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>No image</span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: 12, padding: '4px 10px' }}
            disabled={uploading || removing}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? 'Uploading…' : displayUrl ? 'Replace' : 'Upload'}
          </button>
          {displayUrl && (
            <button
              type="button"
              className="btn btn-danger"
              style={{ fontSize: 12, padding: '4px 10px' }}
              disabled={uploading || removing}
              onClick={handleRemove}
            >
              {removing ? 'Removing…' : 'Remove'}
            </button>
          )}
        </div>
        {error && <span style={{ fontSize: 11, color: 'var(--accent-rose)' }}>{error}</span>}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.gif,.avif"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelected(file);
        }}
      />
    </div>
  );
}

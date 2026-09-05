'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Select } from './Select';
import { ConfirmDialog } from './ConfirmDialog';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  unitType: string;
  isWeighed: boolean;
  priceCents: number;
  costCents: number | null;
  profitCents: number | null;
  marginPct: number | null;
  active: boolean;
  imageKey: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  reorderPoint: number | null;
  taxCategory?: { id: string; name: string; rateBp: number } | null;
}

interface Category { id: string; name: string; parentId: string | null }
interface TaxCategory { id: string; name: string; rateBp: number }

interface Props {
  products: Product[];
  categories: Category[];
  taxCategories: TaxCategory[];
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function formatKes(cents: number) {
  return `KES ${(cents / 100).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}

/**
 * Seeded products store full external URLs (Unsplash) in imageKey while
 * R2 uploads store object keys resolved to imageUrl by the backend.
 * Prefer imageUrl, fall back to imageKey when it is already a URL so seeded
 * images render even if the backend version predates imageUrl.
 */
function resolveImageUrl(p: { imageUrl: string | null; imageKey: string | null }): string | null {
  if (p.imageUrl) return p.imageUrl;
  if (p.imageKey && /^https?:\/\//i.test(p.imageKey)) return p.imageKey;
  return null;
}

/** Must stay in sync with backend R2Service.mimeFromExt — the presigned PUT is signed with this value. */
function mimeFromFilename(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
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

const ACCEPTED_EXT = /\.(jpg|jpeg|png|webp|gif|avif)$/i;
const MAX_FILE_BYTES = 4 * 1024 * 1024;

/* ─── ProductCard ─────────────────────────────────────────────────────────── */
function ProductCard({ product, onEdit, highlighted = false }: { product: Product; onEdit: () => void; highlighted?: boolean }) {
  const margin = product.marginPct;
  const marginColor = margin === null ? 'var(--text-muted)' : margin >= 20 ? 'var(--accent-emerald)' : margin >= 0 ? 'var(--accent-amber)' : 'var(--accent-rose)';
  const cardImageUrl = resolveImageUrl(product);
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = Boolean(cardImageUrl) && !imgFailed;

  return (
    <div
      onClick={onEdit}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.18s, transform 0.18s, box-shadow 0.18s',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        outline: highlighted ? '2px solid var(--accent-primary)' : 'none',
        outlineOffset: 2,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent-primary)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {/* Status dot */}
      <div style={{
        position: 'absolute', top: 10, right: 10, zIndex: 2,
        width: 8, height: 8, borderRadius: '50%',
        background: product.active ? 'var(--accent-emerald)' : 'var(--text-muted)',
        boxShadow: product.active ? '0 0 0 2px rgba(95,173,124,0.25)' : 'none',
      }} />

      {/* Image */}
      <div style={{
        width: '100%', height: 160,
        background: 'var(--bg-surface-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', flexShrink: 0,
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        {showImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cardImageUrl as string}
            alt={product.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--border-strong)', letterSpacing: '-0.02em' }}>
            {initials(product.name)}
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          {product.sku}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
          {product.name}
        </div>
        {product.description && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
            {product.description}
          </div>
        )}
        <div style={{ marginTop: 'auto', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {formatKes(product.priceCents)}
            </div>
            {product.costCents !== null && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                Cost: {formatKes(product.costCents)}
              </div>
            )}
          </div>
          {margin !== null && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: marginColor, fontVariantNumeric: 'tabular-nums' }}>
                {margin}%
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>margin</div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-surface-elevated)',
      }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {product.unitType}{product.isWeighed ? ' · weighed' : ''}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 'var(--radius-pill)',
          background: product.active ? 'var(--accent-emerald-bg)' : 'var(--bg-surface-subtle)',
          color: product.active ? 'var(--accent-emerald)' : 'var(--text-muted)',
        }}>
          {product.active ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  );
}

/* ─── EditPanel (Slide-over) ──────────────────────────────────────────────── */
function EditPanel({
  product, categories, taxCategories, onClose, onSaved,
}: {
  product: Product;
  categories: Category[];
  taxCategories: TaxCategory[];
  onClose: () => void;
  /** Merge an updated product into the grid immediately (optimistic UI + rollback). */
  onSaved: (updated: Product) => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state mirrors product fields
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? '');
  const [sku, setSku] = useState(product.sku);
  const [barcode, setBarcode] = useState(product.barcode ?? '');
  const [priceCents, setPriceCents] = useState(String(product.priceCents / 100));
  const [costCents, setCostCents] = useState(product.costCents !== null ? String(product.costCents / 100) : '');
  const [categoryId, setCategoryId] = useState(product.categoryId ?? '');
  const [taxCategoryId, setTaxCategoryId] = useState(product.taxCategory?.id ?? '');
  const [unitType, setUnitType] = useState(product.unitType);
  const [isWeighed, setIsWeighed] = useState(product.isWeighed);
  const [reorderPoint, setReorderPoint] = useState(product.reorderPoint !== null ? String(product.reorderPoint) : '');
  const [active, setActive] = useState(product.active);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [imgError, setImgError] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const baseImageUrl = resolveImageUrl(product);
  const displayUrl = imagePreview ?? baseImageUrl;
  const [panelImgFailed, setPanelImgFailed] = useState(false);
  const showPanelImg = Boolean(displayUrl) && !panelImgFailed;

  /* ── Image upload ── */
  async function handleImageFile(file: File) {
    setImgError('');
    if (!ACCEPTED_EXT.test(file.name)) { setImgError('Use jpg, png, webp, gif, or avif'); return; }
    if (file.size > MAX_FILE_BYTES) { setImgError('Max 4 MB'); return; }

    setUploading(true);
    setPanelImgFailed(false);
    setImagePreview(URL.createObjectURL(file));
    try {
      // Legacy filename-only body: accepted by both the deployed backend and
      // the updated one (contentType is optional there). Sending contentType
      // first would 400 on the deployed build, so keep this call compatible.
      const presignRes = await fetch(`/api/proxy/products/${product.id}/image/presign`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ filename: file.name }),
      });
      if (!presignRes.ok) {
        const data = await presignRes.json().catch(() => ({} as { message?: unknown }));
        const msg =
          presignRes.status === 503
            ? 'Image storage is not configured on the server. Set R2 env vars (backend/.env locally, hosting env vars in prod) and restart the backend.'
            : (typeof data.message === 'string' ? data.message : 'Presign failed');
        throw new Error(msg);
      }
      const { uploadUrl, key, contentType } = await presignRes.json();

      // Backend signs the PUT with the mime derived from the extension, so
      // send that same value here — not file.type — to avoid signature mismatch.
      const putType = contentType || mimeFromFilename(file.name);
      const putRes = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': putType }, body: file });
      if (!putRes.ok) throw new Error('Upload to storage failed');

      const patchRes = await fetch(`/api/proxy/products/${product.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ imageKey: key }),
      });
      if (!patchRes.ok) {
        const data = await patchRes.json().catch(() => ({} as { message?: string }));
        throw new Error(typeof data.message === 'string' ? data.message : 'Failed to save image');
      }
      // Server truth (includes the resolved imageUrl) updates the grid at once.
      const updated = (await patchRes.json()) as Product;
      onSaved(updated);
      setImagePreview(null);
      setPanelImgFailed(false);
      router.refresh();
    } catch (e) {
      setImgError(e instanceof Error ? e.message : 'Upload failed');
      setImagePreview(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleRemoveImage(): Promise<boolean> {
    setImgError(''); setRemoving(true);
    try {
      const res = await fetch(`/api/proxy/products/${product.id}/image`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { message?: unknown }));
        throw new Error(typeof data.message === 'string' ? data.message : 'Failed to remove image');
      }
      setImagePreview(null);
      setPanelImgFailed(false);
      onSaved({ ...product, imageKey: null, imageUrl: null });
      router.refresh();
      return true;
    } catch (e) {
      setImgError(e instanceof Error ? e.message : 'Failed to remove image');
      return false;
    } finally { setRemoving(false); }
  }

  /* ── Save product details (optimistic: grid updates instantly, rolls back on error) ── */
  async function handleSave() {
    const price = parseFloat(priceCents);
    if (isNaN(price) || price < 0) { setError('Invalid selling price'); return; }
    const costNum = costCents.trim() ? parseFloat(costCents) : null;
    if (costNum !== null && (isNaN(costNum) || costNum < 0)) { setError('Invalid cost price'); return; }
    const reorderNum = reorderPoint.trim() ? parseInt(reorderPoint, 10) : null;
    if (reorderNum !== null && (isNaN(reorderNum) || reorderNum < 0)) { setError('Invalid reorder point'); return; }

    const priceCentsVal = Math.round(price * 100);
    const costCentsVal = costNum === null ? null : Math.round(costNum * 100);
    const profitCentsVal = costCentsVal === null ? null : priceCentsVal - costCentsVal;
    const marginPctVal =
      costCentsVal === null || priceCentsVal <= 0 || profitCentsVal === null
        ? null
        : Math.round((profitCentsVal / priceCentsVal) * 1000) / 10;
    const taxCat = taxCategories.find((t) => t.id === taxCategoryId) ?? null;

    const previous = product;
    const optimistic: Product = {
      ...product,
      name: name.trim(),
      description: description.trim() || null,
      sku: sku.trim(),
      barcode: barcode.trim() || null,
      priceCents: priceCentsVal,
      costCents: costCentsVal,
      profitCents: profitCentsVal,
      marginPct: marginPctVal,
      categoryId: categoryId || null,
      taxCategory: taxCat ? { id: taxCat.id, name: taxCat.name, rateBp: taxCat.rateBp } : null,
      unitType,
      isWeighed,
      reorderPoint: reorderNum,
      active,
    };

    setSaving(true); setError(''); setSuccess(false);
    onSaved(optimistic);
    try {
      const body: Record<string, unknown> = {
        name: optimistic.name,
        description: optimistic.description,
        sku: optimistic.sku,
        barcode: optimistic.barcode,
        priceCents: optimistic.priceCents,
        costCents: optimistic.costCents,
        categoryId: optimistic.categoryId,
        taxCategoryId: taxCategoryId || null,
        unitType: optimistic.unitType,
        isWeighed: optimistic.isWeighed,
        reorderPoint: optimistic.reorderPoint,
        active: optimistic.active,
      };

      const res = await fetch(`/api/proxy/products/${product.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { message?: unknown }));
        throw new Error(typeof data.message === 'string' ? data.message : 'Save failed');
      }

      setSuccess(true);
      router.refresh();
      // Let the confirmation register, then return to the updated grid.
      setTimeout(() => { onClose(); }, 650);
    } catch (e) {
      onSaved(previous);
      setError(e instanceof Error ? e.message : 'Save failed — your edits are preserved, try again');
    } finally { setSaving(false); }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.18s ease',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 101,
        width: 520, maxWidth: '100vw',
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-strong)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.22s var(--ease-spring)',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 18px', borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          position: 'sticky', top: 0, background: 'var(--bg-surface)', zIndex: 10,
        }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-primary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>
              Edit Product
            </p>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
              {product.name}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{product.sku}</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close panel"
            title="Close"
            style={{
              width: 36, height: 36, borderRadius: 'var(--radius-pill)',
              background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, lineHeight: 0, padding: 0,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-strong)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>

          {/* ── Image ── */}
          <div>
            <label style={sectionLabel}>Product Image</label>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              {/* Thumbnail */}
              <div style={{
                width: 96, height: 96, borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)',
                overflow: 'hidden', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {showPanelImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={displayUrl as string} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setPanelImgFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--border-strong)' }}>{initials(product.name)}</span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || removing}
                  style={{ ...secondaryBtn, minHeight: 40, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <path d="m17 8-5-5-5 5" />
                    <path d="M12 3v12" />
                  </svg>
                  <span>{uploading ? 'Uploading…' : displayUrl ? 'Replace Image' : 'Upload Image'}</span>
                </button>
                {displayUrl && (
                  <button type="button" onClick={() => { setImgError(''); setConfirmRemove(true); }} disabled={uploading || removing} style={{ ...dangerBtn, minHeight: 40, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 6h18" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span>{removing ? 'Removing…' : 'Remove Image'}</span>
                  </button>
                )}
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>JPG, PNG, WebP · Max 4 MB</p>
                {imgError && <p role="alert" style={{ fontSize: 11, color: 'var(--accent-rose)' }}>{imgError}</p>}
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.gif,.avif" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} />
          </div>

          {/* ── Basic Info ── */}
          <fieldset style={fieldset}>
            <legend style={legendStyle}>Basic Info</legend>
            <div className="form-grid-2col">
              <div style={formGroup}>
                <label style={inputLabel}>Product Name *</label>
                <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jogoo Maize Flour 2kg" />
              </div>
              <div style={formGroup}>
                <label style={inputLabel}>SKU *</label>
                <input style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: 12 }} value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. UNG-001" />
              </div>
            </div>
            <div style={formGroup}>
              <label style={inputLabel}>Description</label>
              <textarea
                style={{ ...inputStyle, minHeight: 72, resize: 'vertical', lineHeight: 1.5 }}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Short product description (optional)"
              />
            </div>
            <div style={formGroup}>
              <label style={inputLabel}>Barcode / EAN</label>
              <input style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: 12 }} value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="e.g. 616110000101" />
            </div>
          </fieldset>

          {/* ── Pricing ── */}
          <fieldset style={fieldset}>
            <legend style={legendStyle}>Pricing &amp; Tax</legend>
            <div className="form-grid-2col">
              <div style={formGroup}>
                <label style={inputLabel}>Selling Price (KES) *</label>
                <div style={inputWithPrefix}>
                  <span style={prefixStyle}>KES</span>
                  <input style={{ ...inputStyle, paddingLeft: 48, fontVariantNumeric: 'tabular-nums' }}
                    type="number" min={0} step={0.01}
                    value={priceCents} onChange={e => setPriceCents(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div style={formGroup}>
                <label style={inputLabel}>Cost / Buying Price (KES)</label>
                <div style={inputWithPrefix}>
                  <span style={prefixStyle}>KES</span>
                  <input style={{ ...inputStyle, paddingLeft: 48, fontVariantNumeric: 'tabular-nums' }}
                    type="number" min={0} step={0.01}
                    value={costCents} onChange={e => setCostCents(e.target.value)} placeholder="Not set" />
                </div>
              </div>
            </div>
            {product.profitCents !== null && (
              <div style={{ padding: '10px 14px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 20 }}>
                <span>Profit: <strong style={{ color: product.profitCents >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>{formatKes(product.profitCents)}</strong></span>
                {product.marginPct !== null && <span>Margin: <strong style={{ color: product.profitCents >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>{product.marginPct}%</strong></span>}
              </div>
            )}
            <div style={formGroup}>
              <label style={inputLabel}>Tax Category</label>
              <Select
                id={`tax-category-${product.id}`}
                value={taxCategoryId}
                onChange={setTaxCategoryId}
                options={[
                  { value: '', label: 'None' },
                  ...taxCategories.map(tc => ({ value: tc.id, label: `${tc.name} (${(tc.rateBp / 100).toFixed(0)}%)` })),
                ]}
              />
            </div>
          </fieldset>

          {/* ── Classification ── */}
          <fieldset style={fieldset}>
            <legend style={legendStyle}>Classification</legend>
            <div className="form-grid-2col">
              <div style={formGroup}>
                <label style={inputLabel}>Category</label>
                <Select
                  id={`category-${product.id}`}
                  value={categoryId}
                  onChange={setCategoryId}
                  options={[
                    { value: '', label: 'Uncategorized' },
                    ...categories.map(c => ({ value: c.id, label: c.name })),
                  ]}
                />
              </div>
              <div style={formGroup}>
                <label style={inputLabel}>Unit Type</label>
                <Select
                  id={`unit-type-${product.id}`}
                  value={unitType}
                  onChange={setUnitType}
                  options={['each', 'kg', 'g', 'litre', 'ml', 'dozen', 'pack', 'box'].map(u => ({ value: u, label: u }))}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              <label style={checkboxLabel}>
                <input type="checkbox" checked={isWeighed} onChange={e => setIsWeighed(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent-primary)' }} />
                <span>Weighed item (scale required at POS)</span>
              </label>
              <label style={checkboxLabel}>
                <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent-primary)' }} />
                <span>Active (visible on register)</span>
              </label>
            </div>
          </fieldset>

          {/* ── Inventory ── */}
          <fieldset style={fieldset}>
            <legend style={legendStyle}>Inventory</legend>
            <div style={formGroup}>
              <label style={inputLabel}>Reorder Point (units)</label>
              <input style={{ ...inputStyle, width: 160 }} type="number" min={0} step={1}
                value={reorderPoint} onChange={e => setReorderPoint(e.target.value)} placeholder="e.g. 10" />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Alert when stock falls to or below this quantity
              </p>
            </div>
          </fieldset>

          {/* ── Error / Success ── */}
          {error && (
            <div role="alert" style={{ padding: '10px 14px', background: 'var(--accent-rose-bg)', border: '1px solid rgba(224,109,115,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-rose)', fontSize: 13 }}>
              {error}
            </div>
          )}
          {success && (
            <div aria-live="polite" style={{ padding: '10px 14px', background: 'var(--accent-emerald-bg)', border: '1px solid rgba(95,173,124,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-emerald)', fontSize: 13 }}>
              Product saved — closing…
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--border-subtle)',
          display: 'flex', gap: 10, justifyContent: 'flex-end',
          position: 'sticky', bottom: 0, background: 'var(--bg-surface)',
        }}>
          <button onClick={onClose} style={secondaryBtn}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '9px 20px', borderRadius: 'var(--radius-sm)',
            background: saving ? 'var(--bg-surface-subtle)' : 'var(--accent-primary)',
            color: saving ? 'var(--text-muted)' : '#fff',
            fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
            border: 'none', transition: 'background 0.15s',
          }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {confirmRemove && (
        <ConfirmDialog
          title="Remove Image"
          message={`Remove the image from ${product.name}? The file is deleted from storage and this cannot be undone.`}
          confirmLabel="Remove Image"
          loading={removing}
          error={imgError}
          onCancel={() => {
            if (!removing) setConfirmRemove(false);
          }}
          onConfirm={async () => {
            const ok = await handleRemoveImage();
            if (ok) setConfirmRemove(false);
          }}
        />
      )}
    </>
  );
}

/* ─── Style helpers ───────────────────────────────────────────────────────── */
const sectionLabel: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10,
};
const fieldset: React.CSSProperties = {
  border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
  padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 14,
};
const legendStyle: React.CSSProperties = {
  padding: '0 8px', fontSize: 11, fontWeight: 700,
  color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase',
};
const formGroup: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 5,
};
const inputLabel: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)',
  background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)',
  color: 'var(--text-primary)', fontSize: 13, outline: 'none',
  fontFamily: 'var(--font-sans)',
  transition: 'border-color 0.15s',
};
const inputWithPrefix: React.CSSProperties = {
  position: 'relative',
};
const prefixStyle: React.CSSProperties = {
  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
  fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', pointerEvents: 'none',
};
const secondaryBtn: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 'var(--radius-sm)',
  background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)',
  color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
};
const dangerBtn: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 'var(--radius-sm)',
  background: 'var(--accent-rose-bg)', border: '1px solid rgba(224,109,115,0.25)',
  color: 'var(--accent-rose)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
};
const checkboxLabel: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer',
};

/* ─── Main Grid Export ─────────────────────────────────────────────────────── */
export function ProductsGrid({ products, categories, taxCategories }: Props) {
  const [editing, setEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  // Local mirror of the server list so saves apply optimistically and the
  // panel always sees live data. Reconciled whenever fresh props arrive.
  const [items, setItems] = useState(products);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    setItems(products);
  }, [products]);

  function handleSaved(updated: Product) {
    setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setHighlightId(updated.id);
    setTimeout(() => {
      setHighlightId((cur) => (cur === updated.id ? null : cur));
    }, 1800);
  }

  const filtered = items.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()) || (p.barcode ?? '').includes(search);
    const matchActive = filterActive === 'all' || (filterActive === 'active' ? p.active : !p.active);
    return matchSearch && matchActive;
  });

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 340 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', display: 'inline-flex', lineHeight: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <input
            type="search"
            placeholder="Search by name, SKU or barcode…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 36px',
              borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)', color: 'var(--text-primary)',
              fontSize: 13, outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'active', 'inactive'] as const).map(v => (
            <button key={v} onClick={() => setFilterActive(v)} className="filter-pill" style={{
              padding: '7px 14px', borderRadius: 'var(--radius-sm)', fontSize: 12,
              fontWeight: filterActive === v ? 700 : 500, cursor: 'pointer',
              background: filterActive === v ? 'var(--accent-primary)' : 'var(--bg-surface)',
              color: filterActive === v ? '#fff' : 'var(--text-secondary)',
              border: filterActive === v ? 'none' : '1px solid var(--border-subtle)',
              transition: 'all 0.15s',
            }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {filtered.length} of {items.length}
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
          {search ? `No products matching "${search}"` : 'No products found'}
        </div>
      ) : (
        <div className="products-grid">
          {filtered.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              highlighted={p.id === highlightId}
              onEdit={() => setEditing(p)}
            />
          ))}
        </div>
      )}

      {/* Edit slide-over — reads the live item so optimistic updates show inside the panel too */}
      {editing && (
        <EditPanel
          product={items.find((p) => p.id === editing.id) ?? editing}
          categories={categories}
          taxCategories={taxCategories}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
        input:focus, textarea:focus, select:focus { border-color: var(--border-focus) !important; }
      `}</style>
    </>
  );
}

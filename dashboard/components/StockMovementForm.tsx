'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Select } from './Select';

interface ProductOption {
  id: string;
  name: string;
  sku: string;
}

interface LocationOption {
  id: string;
  name: string;
}

interface Props {
  products: ProductOption[];
  locations: LocationOption[];
  initialProductId?: string;
  selectedProductId?: string;
  onMovementRecorded?: (
    movement: any,
    newBalance?: number,
    productId?: string,
    quantityDelta?: number,
  ) => void;
}

const REASON_OPTIONS = [
  { value: 'receiving', label: 'Receiving (stock in)' },
  { value: 'adjustment', label: 'Stock Adjustment' },
  { value: 'return', label: 'Customer Return' },
  { value: 'shrinkage', label: 'Shrinkage / Theft' },
  { value: 'waste', label: 'Waste / Spoilage' },
];

const ADDS_STOCK = new Set(['receiving', 'return', 'adjustment']);

export function StockMovementForm({
  products,
  locations,
  initialProductId,
  selectedProductId,
  onMovementRecorded,
}: Props) {
  const router = useRouter();
  const [productId, setProductId] = useState(selectedProductId ?? initialProductId ?? products[0]?.id ?? '');
  const [locationId, setLocationId] = useState(locations[0]?.id ?? '');
  const [reason, setReason] = useState('receiving');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedProductId) {
      setProductId(selectedProductId);
      setReason('receiving');
      setQuantity('');
      const qtyInput = document.getElementById('movement-quantity');
      if (qtyInput) {
        qtyInput.focus();
      }
    }
  }, [selectedProductId]);

  const productOptions = products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }));
  const locationOptions = locations.map((l) => ({ value: l.id, label: l.name }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const qty = Number(quantity);
    if (!productId || !locationId) {
      setError('Product and location are required');
      return;
    }
    if (!qty || qty <= 0) {
      setError('Enter a quantity greater than 0');
      return;
    }

    setLoading(true);
    try {
      const signedQty = ADDS_STOCK.has(reason) ? qty : -qty;
      const res = await fetch(`/api/proxy/inventory/movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productId,
          locationId,
          quantityDelta: signedQty,
          reason,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? 'Failed to record movement');
        return;
      }

      const data = await res.json().catch(() => null);
      const newBalance = data?.currentStock?.quantity;
      const product = products.find((p) => p.id === productId);
      const balanceNote = newBalance !== undefined ? ` — new balance: ${Number(newBalance)}` : '';
      setSuccess(
        `Recorded ${signedQty > 0 ? '+' : ''}${signedQty} for ${product?.name ?? 'product'}${balanceNote}`
      );
      if (onMovementRecorded) {
        onMovementRecorded(
          data?.movement,
          newBalance !== undefined ? Number(newBalance) : undefined,
          productId,
          signedQty,
        );
      }
      setQuantity('');
      router.refresh();
    } catch {
      setError('Network error — check backend connection');
    } finally {
      setLoading(false);
    }
  }

  if (products.length === 0 || locations.length === 0) {
    return (
      <div className="empty-box" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 8px', opacity: 0.5 }}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        <p style={{ fontSize: 13 }}>
          {products.length === 0 ? 'No products available for stock movement.' : 'No inventory locations configured.'}
        </p>
      </div>
    );
  }

  const isAdding = ADDS_STOCK.has(reason);

  return (
    <form onSubmit={handleSubmit} id="stock-movement-form" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div className="form-error" role="alert" style={{
          padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--accent-rose-bg)',
          color: 'var(--accent-rose)', border: '1px solid rgba(224,109,115,0.3)', fontSize: 12, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
          {error}
        </div>
      )}
      {success && (
        <div className="form-success" aria-live="polite" style={{
          padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--accent-emerald-bg)',
          color: 'var(--accent-emerald)', border: '1px solid rgba(95,173,124,0.3)', fontSize: 12, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          {success}
        </div>
      )}

      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="movement-product" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Target Product
        </label>
        <Select id="movement-product" value={productId} onChange={setProductId} options={productOptions} />
      </div>

      <div className="grid-2" style={{ gap: 12, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="movement-location" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Location
          </label>
          <Select id="movement-location" value={locationId} onChange={setLocationId} options={locationOptions} />
        </div>

        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="movement-reason" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Reason Type
          </label>
          <Select id="movement-reason" value={reason} onChange={setReason} options={REASON_OPTIONS} />
        </div>
      </div>

      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label htmlFor="movement-quantity" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Quantity
          </label>
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: isAdding ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            display: 'flex', alignItems: 'center', gap: 4
          }}>
            {isAdding ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                Adds to stock (+ delta)
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/></svg>
                Subtracts from stock (- delta)
              </>
            )}
          </span>
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            id="movement-quantity"
            type="number"
            min="0.001"
            step="0.001"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g. 50"
            required
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-mono)',
              outline: 'none', transition: 'border-color 0.15s ease'
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        id="stock-movement-submit"
        disabled={loading}
        style={{
          width: '100%', justifyContent: 'center', padding: '11px 20px',
          borderRadius: 'var(--radius-md)', backgroundColor: 'var(--accent-primary)',
          color: '#fff', fontWeight: 700, fontSize: 13, border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          display: 'flex', alignItems: 'center', gap: 8, marginTop: 4,
          boxShadow: '0 2px 8px rgba(217,119,87,0.25)', transition: 'all 0.15s ease'
        }}
      >
        {loading ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinner"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
            Recording Movement…
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Record Movement
          </>
        )}
      </button>
    </form>
  );
}


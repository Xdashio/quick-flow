'use client';

import { useState, FormEvent } from 'react';
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
}

const REASON_OPTIONS = [
  { value: 'receiving', label: 'Receiving (stock in)' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'return', label: 'Customer return' },
  { value: 'shrinkage', label: 'Shrinkage' },
  { value: 'waste', label: 'Waste / spoilage' },
];

// These reasons add stock; the rest subtract it. The sign is applied to
// whatever magnitude the user enters so they never have to type a minus sign.
const ADDS_STOCK = new Set(['receiving', 'return', 'adjustment']);

export function StockMovementForm({ products, locations, initialProductId }: Props) {
  const router = useRouter();
  const [productId, setProductId] = useState(initialProductId ?? products[0]?.id ?? '');
  const [locationId, setLocationId] = useState(locations[0]?.id ?? '');
  const [reason, setReason] = useState('receiving');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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
        `Recorded ${signedQty > 0 ? '+' : ''}${signedQty} for ${product?.name ?? 'product'}${balanceNote}`,
      );
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
      <p className="td-muted" style={{ fontSize: 13 }}>
        {products.length === 0 ? 'No products available.' : 'No locations available.'}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} id="stock-movement-form">
      {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}
      {success && (
        <div className="form-success" style={{ marginBottom: 12 }}>
          {success}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="movement-product">Product</label>
        <Select id="movement-product" value={productId} onChange={setProductId} options={productOptions} />
      </div>

      <div className="form-group">
        <label htmlFor="movement-location">Location</label>
        <Select id="movement-location" value={locationId} onChange={setLocationId} options={locationOptions} />
      </div>

      <div className="form-group">
        <label htmlFor="movement-reason">Reason</label>
        <Select id="movement-reason" value={reason} onChange={setReason} options={REASON_OPTIONS} />
      </div>

      <div className="form-group">
        <label htmlFor="movement-quantity">Quantity</label>
        <input
          id="movement-quantity"
          type="number"
          min="0.001"
          step="0.001"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="e.g. 24"
          required
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        id="stock-movement-submit"
        disabled={loading}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        {loading ? 'Recording…' : 'Record Movement'}
      </button>
    </form>
  );
}

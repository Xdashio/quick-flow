'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  productId: string;
  costCents: number | null;
}

/** Inline-editable buying/cost price, entered in KES (shillings), stored as cents. */
export function CostPriceInput({ productId, costCents }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(costCents === null ? '' : String(costCents / 100));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    const trimmed = value.trim();
    const parsedKes = trimmed === '' ? null : Number(trimmed);
    if (parsedKes !== null && (!Number.isFinite(parsedKes) || parsedKes < 0)) {
      setError('Enter an amount ≥ 0');
      return;
    }
    const parsedCents = parsedKes === null ? null : Math.round(parsedKes * 100);

    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/proxy/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ costCents: parsedCents }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? 'Failed to update cost price');
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update cost price');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <input
        type="number"
        min={0}
        step={0.01}
        value={value}
        placeholder="Not set"
        disabled={saving}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        style={{ width: 90, fontSize: 12.5, padding: '4px 8px' }}
      />
      {error && <span style={{ fontSize: 10.5, color: 'var(--accent-rose)' }}>{error}</span>}
    </div>
  );
}

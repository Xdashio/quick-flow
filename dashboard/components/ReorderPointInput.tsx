'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  productId: string;
  reorderPoint: number | null;
}

export function ReorderPointInput({ productId, reorderPoint }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(reorderPoint === null ? '' : String(reorderPoint));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    const trimmed = value.trim();
    const parsed = trimmed === '' ? null : Number(trimmed);
    if (parsed !== null && (!Number.isInteger(parsed) || parsed < 0)) {
      setError('Whole number ≥ 0');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/proxy/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reorderPoint: parsed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? 'Failed to update reorder point');
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update reorder point');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <input
        type="number"
        min={0}
        step={1}
        value={value}
        placeholder="None"
        disabled={saving}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        style={{ width: 72, fontSize: 12.5, padding: '4px 8px' }}
      />
      {error && <span style={{ fontSize: 10.5, color: 'var(--accent-rose)' }}>{error}</span>}
    </div>
  );
}

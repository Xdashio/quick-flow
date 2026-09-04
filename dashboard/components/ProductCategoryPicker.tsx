'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Select } from './Select';

interface Props {
  productId: string;
  categoryId: string | null;
  categories: { id: string; name: string }[];
}

export function ProductCategoryPicker({ productId, categoryId, categories }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const options = [
    { value: '', label: 'Uncategorized' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  async function handleChange(value: string) {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/proxy/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ categoryId: value || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? 'Failed to update category');
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update category');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ opacity: saving ? 0.6 : 1, minWidth: 150 }}>
      <Select id={`category-picker-${productId}`} value={categoryId ?? ''} onChange={handleChange} options={options} />
      {error && <div style={{ fontSize: 11, color: 'var(--accent-rose)', marginTop: 4 }}>{error}</div>}
    </div>
  );
}

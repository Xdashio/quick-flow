'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Select } from './Select';

interface CategoryOption {
  id: string;
  name: string;
}

interface Props {
  categories: CategoryOption[];
}

export function CreateCategoryForm({ categories }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const parentOptions = [
    { value: '', label: 'None — top level' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`/api/proxy/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, parentId: parentId || undefined }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? 'Failed to create category');
        return;
      }

      const category = await res.json();
      setSuccess(`Created "${category.name}"`);
      setName('');
      setParentId('');
      router.refresh();
    } catch {
      setError('Network error — check backend connection');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} id="create-category-form">
      {error && <div className="form-error" role="alert" style={{ marginBottom: 12 }}>{error}</div>}
      {success && (
        <div className="form-success" aria-live="polite" style={{ marginBottom: 12 }}>
          {success}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="new-category-name">Name</label>
        <input
          id="new-category-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Beverages"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="new-category-parent">Parent category</label>
        <Select id="new-category-parent" value={parentId} onChange={setParentId} options={parentOptions} />
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        id="create-category-submit"
        disabled={loading}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        {loading ? 'Creating…' : 'Create Category'}
      </button>
    </form>
  );
}

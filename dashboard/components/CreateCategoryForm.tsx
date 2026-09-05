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
    <form onSubmit={handleSubmit} id="create-category-form" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {error && <div className="form-error" role="alert" style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-rose-bg)', color: 'var(--accent-rose)', border: '1px solid rgba(224,109,115,0.3)', fontSize: 13 }}>{error}</div>}
      {success && (
        <div className="form-success" aria-live="polite" style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-emerald-bg)', color: 'var(--accent-emerald)', border: '1px solid rgba(95,173,124,0.3)', fontSize: 13 }}>
          {success}
        </div>
      )}

      <fieldset style={{
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 18px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        <legend style={{
          padding: '0 8px',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-secondary)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          Category Details
        </legend>

        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="new-category-name" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Category Name *
          </label>
          <input
            id="new-category-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Beverages, Dairy, Snacks..."
            required
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>

        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="new-category-parent" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Parent Category (Optional)
          </label>
          <Select id="new-category-parent" value={parentId} onChange={setParentId} options={parentOptions} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Sub-categories inherit properties and allow nested organization
          </span>
        </div>
      </fieldset>

      <button
        type="submit"
        className="btn btn-primary"
        id="create-category-submit"
        disabled={loading}
        style={{
          width: '100%',
          justifyContent: 'center',
          padding: '10px 18px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--accent-primary)',
          color: '#fff',
          fontWeight: 700,
          fontSize: 13,
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Creating…' : 'Create Category'}
      </button>
    </form>
  );
}

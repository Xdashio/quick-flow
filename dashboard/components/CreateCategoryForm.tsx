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
    { value: '', label: 'None — Top-level Category' },
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
    <form onSubmit={handleSubmit} id="create-category-form" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
        <label htmlFor="new-category-name" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Category Name *
        </label>
        <input
          id="new-category-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Beverages, Dairy, Electronics..."
          required
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)', fontSize: 13, outline: 'none',
            transition: 'border-color 0.15s ease'
          }}
        />
      </div>

      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="new-category-parent" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Parent Category (Optional)
        </label>
        <Select id="new-category-parent" value={parentId} onChange={setParentId} options={parentOptions} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Nested categories inherit properties for organized reporting
        </span>
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        id="create-category-submit"
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
            Creating Category…
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Create Category
          </>
        )}
      </button>
    </form>
  );
}


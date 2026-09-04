'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3000';

interface Props {
  categoryId: string;
  categoryName: string;
  productCount: number;
  childCount: number;
}

export function DeleteCategoryButton({ categoryId, categoryName, productCount, childCount }: Props) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND}/api/categories/${categoryId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? 'Failed to delete category');
        return;
      }
      setShow(false);
      router.refresh();
    } catch {
      setError('Network error — check backend connection');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {show && (
        <div className="deactivate-modal open" role="dialog" aria-modal="true">
          <div className="deactivate-modal-content">
            <h3>Delete Category</h3>
            <p>
              Delete &ldquo;{categoryName}&rdquo;?
              {productCount > 0
                ? ` ${productCount} product${productCount === 1 ? '' : 's'} will become uncategorized.`
                : ''}
            </p>
            {childCount > 0 && (
              <p className="dim-warning">
                This category has {childCount} subcategor{childCount === 1 ? 'y' : 'ies'} — move or
                delete them first.
              </p>
            )}
            {error && <div className="form-error" style={{ marginTop: 8 }}>{error}</div>}
            <div className="deactivate-modal-actions">
              <button className="btn btn-secondary" onClick={() => setShow(false)} disabled={loading}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirm}
                disabled={loading || childCount > 0}
              >
                {loading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      <button
        className="btn btn-danger"
        id={`delete-category-${categoryId}`}
        onClick={() => setShow(true)}
        style={{ fontSize: 12, padding: '4px 10px' }}
      >
        Delete
      </button>
    </>
  );
}

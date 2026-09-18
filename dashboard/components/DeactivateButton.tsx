'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  userId: string;
  userName: string;
  isActive: boolean;
  role?: string;
  /** Self-deactivation is blocked here (would lock you out mid-session) — the
   * backend also rejects it. Deactivating the last active admin is rejected
   * by the backend with an explanatory error shown in the modal. */
  currentUserId: string;
}

export function DeactivateButton({ userId, userName, isActive, currentUserId }: Props) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // You can't deactivate yourself through this control — use your profile.
  const isLocked = userId === currentUserId;
  const action: 'deactivate' | 'reactivate' = isActive ? 'deactivate' : 'reactivate';

  function open() {
    if (isLocked) return;
    setError('');
    setShow(true);
  }

  function cancel() {
    setShow(false);
    setError('');
  }

  async function confirm() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/proxy/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active: !isActive }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? `Failed to ${action} user`);
      }

      setShow(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to ${action} user`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {show && (
        <div className="deactivate-modal open" role="dialog" aria-modal="true">
          <div className="deactivate-modal-content">
            <h3>{action === 'deactivate' ? 'Deactivate User' : 'Reactivate User'}</h3>
            <p>
              {action === 'deactivate'
                ? `This will immediately prevent ${userName} from logging in.`
                : `This will restore ${userName}'s login access.`}
            </p>
            {error && <div className="form-error" role="alert" style={{ marginTop: 8 }}>{error}</div>}
            <div className="deactivate-modal-actions">
              <button className="btn btn-secondary" onClick={cancel} disabled={loading}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={confirm} disabled={loading}>
                {loading ? '…' : action === 'deactivate' ? 'Deactivate' : 'Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
      <button
        className={`btn ${isActive ? 'btn-danger' : 'btn-success'}`}
        id={`toggle-user-${userId}`}
        onClick={open}
        disabled={loading || isLocked}
        title={isLocked ? 'You cannot deactivate your own account' : undefined}
        style={{ fontSize: 13, padding: '6px 12px' }}
      >
        {loading ? '…' : isActive ? 'Deactivate' : 'Reactivate'}
      </button>
    </>
  );
}

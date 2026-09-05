'use client';

import { useEffect } from 'react';

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  /** Red confirm button for destructive actions, primary otherwise. */
  danger?: boolean;
  loading?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * ConfirmDialog
 *
 * Generic confirmation modal reusing the deactivate-modal styles: backdrop
 * click or Escape cancels (unless busy), Enter-confirmed via the button.
 * Use for every destructive or hard-to-undo action.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  danger = true,
  loading = false,
  error = '',
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onCancel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [loading, onCancel]);

  return (
    <div
      className="deactivate-modal open"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={() => {
        if (!loading) onCancel();
      }}
    >
      <div className="deactivate-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        {error && (
          <div className="form-error" role="alert" style={{ marginTop: 8 }}>
            {error}
          </div>
        )}
        <div className="deactivate-modal-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
            autoFocus
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

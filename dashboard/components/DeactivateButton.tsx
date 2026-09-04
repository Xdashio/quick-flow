'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3000';

interface Props {
  userId: string;
  userName: string;
  isActive: boolean;
  role?: string;
}

function useDeactivateModal() {
  const [show, setShow] = useState(false);
  const [action, setAction] = useState<'deactivate' | 'reactivate'>('deactivate');

  const open = (isActive: boolean, userRole?: string) => {
    // Prevent admin deactivation - admins cannot be deactivated by anyone
    if (userRole === 'admin') {
      setShow(false);
      return false;
    }
    setAction(isActive ? 'deactivate' : 'reactivate');
    setShow(true);
    return true;
  };

  const handleConfirm = async () => {
    setShow(false);
    return true;
  };

  const handleCancel = () => setShow(false);

  return { show, action, open, handleConfirm, handleCancel };
}

export function DeactivateButton({ userId, userName, isActive, role }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { show, action, open, handleConfirm, handleCancel } = useDeactivateModal();

  return (
    <>
      {show ? (
        <div className="deactivate-modal" role="dialog" aria-modal="true">
          <div className="deactivate-modal-content">
            <h3>{action === 'deactivate' ? 'Deactivate User' : 'Reactivate User'}</h3>
            <p>
              {action === 'deactivate'
                ? 'This will immediately prevent them from logging in.'
                : 'This will restore their login access.'}
            </p>
            <p>{action === 'deactivate' && role === 'admin' ? 'Admins cannot be deactivated.' : ''}</p>
            <div className="deactivate-modal-actions">
              <button
                className="btn btn-secondary"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirm}
              >
                {action}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          className="btn"
          id={`toggle-user-${userId}`}
          onClick={() => open(isActive, role)}
          disabled={loading}
          style={{ fontSize: 13, padding: '6px 12px' }}
        >
          {loading ? '…' : isActive ? 'Deactivate' : 'Reactivate'}
        </button>
      )}
    </>
  );
}

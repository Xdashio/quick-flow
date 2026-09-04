'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3000';

interface Props {
  userId: string;
  userName: string;
  isActive: boolean;
}

export function DeactivateButton({ userId, userName, isActive }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const action = isActive ? 'deactivate' : 'reactivate';
    const confirmed = window.confirm(
      `${isActive ? 'Deactivate' : 'Reactivate'} user "${userName}"?\n\n` +
        (isActive
          ? 'This will immediately prevent them from logging in.'
          : 'This will restore their login access.'),
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      await fetch(`${BACKEND}/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active: !isActive }),
      });
      router.refresh();
    } catch (e) {
      alert(`Failed to ${action} user`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className={`btn ${isActive ? 'btn-danger' : 'btn-ghost'}`}
      id={`toggle-user-${userId}`}
      onClick={toggle}
      disabled={loading}
      style={{ fontSize: 12, padding: '5px 10px' }}
    >
      {loading ? '…' : isActive ? 'Deactivate' : 'Reactivate'}
    </button>
  );
}

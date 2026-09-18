'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Select } from './Select';

interface Props {
  userId: string;
  userName: string;
  role: string;
  currentUserId: string;
  currentRole: string;
}

const ROLE_OPTIONS = [
  { value: 'cashier', label: 'Cashier (Register Access)' },
  { value: 'manager', label: 'Manager (Inventory & Reports)' },
  { value: 'admin', label: 'Admin (Full Access)' },
];

/**
 * Edit another staff member: rename, change role (admins only), reset
 * PIN/password. Managers only ever see this for cashier rows — enforced
 * again by the backend, this is just UI scoping.
 */
export function EditUserDialog({ userId, userName, role, currentUserId, currentRole }: Props) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [name, setName] = useState(userName);
  const [newRole, setNewRole] = useState(role);
  const [credential, setCredential] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (userId === currentUserId) return null;
  if (currentRole === 'manager' && role !== 'cashier') return null;

  const canChangeRole = currentRole === 'admin';
  const isCashierTarget = (canChangeRole ? newRole : role) === 'cashier';

  function open() {
    setName(userName);
    setNewRole(role);
    setCredential('');
    setError('');
    setShow(true);
  }

  function cancel() {
    setShow(false);
    setError('');
  }

  async function save() {
    setError('');

    const body: Record<string, string> = {};
    if (name.trim() && name.trim() !== userName) body.name = name.trim();
    if (canChangeRole && newRole !== role) body.role = newRole;
    if (credential) {
      if (isCashierTarget && !/^\d{4,6}$/.test(credential)) {
        setError('Cashier PIN must be 4–6 digits (numbers only).');
        return;
      }
      if (!isCashierTarget) {
        if (credential.length < 8) {
          setError('Manager/Admin password must be at least 8 characters.');
          return;
        }
        if (!/[A-Za-z]/.test(credential) || !/\d/.test(credential)) {
          setError('Manager/Admin password must contain both letters and numbers.');
          return;
        }
      }
      body.password = credential;
    }

    if (Object.keys(body).length === 0) {
      setError('No changes to save.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? 'Failed to update user');
      }

      setShow(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update user');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
    background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)', fontSize: 13, outline: 'none',
  } as const;

  return (
    <>
      {show && (
        <div className="deactivate-modal open" role="dialog" aria-modal="true">
          <div className="deactivate-modal-content">
            <h3>Edit {userName}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor={`edit-name-${userId}`} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Name / Username
                </label>
                <input id={`edit-name-${userId}`} type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
              </div>

              {canChangeRole && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label htmlFor={`edit-role-${userId}`} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Role
                  </label>
                  <Select id={`edit-role-${userId}`} value={newRole} onChange={setNewRole} options={ROLE_OPTIONS} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor={`edit-cred-${userId}`} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {isCashierTarget ? 'Reset Till PIN (optional)' : 'Reset Password (optional)'}
                </label>
                <input
                  id={`edit-cred-${userId}`}
                  type={isCashierTarget ? 'text' : 'password'}
                  inputMode={isCashierTarget ? 'numeric' : undefined}
                  autoComplete="new-password"
                  value={credential}
                  onChange={(e) => setCredential(isCashierTarget ? e.target.value.replace(/\D/g, '').slice(0, 6) : e.target.value)}
                  placeholder={isCashierTarget ? 'Leave blank to keep · 4–6 digits' : 'Leave blank to keep · min 8, letters + numbers'}
                  style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>
            {error && <div className="form-error" role="alert" style={{ marginTop: 8 }}>{error}</div>}
            <div className="deactivate-modal-actions">
              <button className="btn btn-secondary" onClick={cancel} disabled={loading}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={save} disabled={loading}>
                {loading ? '…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
      <button
        className="btn btn-secondary"
        id={`edit-user-${userId}`}
        onClick={open}
        style={{ fontSize: 13, padding: '6px 12px' }}
      >
        Edit
      </button>
    </>
  );
}

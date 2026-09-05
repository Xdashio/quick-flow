'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Select } from './Select';

const ROLE_OPTIONS = [
  { value: 'cashier', label: 'Cashier' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
];

export function CreateUserForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('cashier');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`/api/proxy/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, password, role }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? 'Failed to create user');
        return;
      }

      const user = await res.json();
      setSuccess(`Created user "${user.name}" (${user.role})`);
      setName('');
      setPassword('');
      setRole('cashier');
      router.refresh();
    } catch {
      setError('Network error — check backend connection');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} id="create-user-form" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
          User Credentials & Access
        </legend>

        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="new-user-name" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Full Name (Used as Username) *
          </label>
          <input
            id="new-user-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jane Mwangi or Cashier 1"
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
          <label htmlFor="new-user-password" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Password / Cashier PIN *
          </label>
          <input
            id="new-user-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 4 digits for Cashier PIN or password"
            required
            minLength={4}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
              outline: 'none',
            }}
          />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Cashiers sign into the Register using this PIN or Password.
          </span>
        </div>

        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="new-user-role" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Role Permission Level *
          </label>
          <Select id="new-user-role" value={role} onChange={setRole} options={ROLE_OPTIONS} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {role === 'cashier' ? 'Cashier: POS register access only' : role === 'manager' ? 'Manager: Inventory & reporting access' : 'Admin: Full system configuration'}
          </span>
        </div>
      </fieldset>

      <button
        type="submit"
        className="btn btn-primary"
        id="create-user-submit"
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
        {loading ? 'Creating…' : 'Create User'}
      </button>
    </form>
  );
}
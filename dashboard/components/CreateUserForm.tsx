'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Select } from './Select';

const ROLE_OPTIONS = [
  { value: 'cashier', label: 'Cashier (Register Access)' },
  { value: 'manager', label: 'Manager (Inventory & Reports)' },
  { value: 'admin', label: 'Admin (Full Access)' },
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
    <form onSubmit={handleSubmit} id="create-user-form" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
        <label htmlFor="new-user-name" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Full Name / Username *
        </label>
        <input
          id="new-user-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Jane Mwangi or Cashier 1"
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
        <label htmlFor="new-user-password" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Password / Cashier PIN *
        </label>
        <input
          id="new-user-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min 4 digits PIN or password"
          required
          minLength={4}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-mono)',
            outline: 'none', transition: 'border-color 0.15s ease'
          }}
        />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Cashiers use this PIN or Password to sign into the POS register
        </span>
      </div>

      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="new-user-role" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Role Permission Level *
        </label>
        <Select id="new-user-role" value={role} onChange={setRole} options={ROLE_OPTIONS} />
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        id="create-user-submit"
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
            Creating User…
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>
            Create Staff User
          </>
        )}
      </button>
    </form>
  );
}
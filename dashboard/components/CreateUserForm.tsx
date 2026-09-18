'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Select } from './Select';

const ALL_ROLES = [
  { value: 'cashier', label: 'Cashier (Register Access)' },
  { value: 'manager', label: 'Manager (Inventory & Reports)' },
  { value: 'admin', label: 'Admin (Full Access)' },
];

export function CreateUserForm({ currentRole }: { currentRole: string }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [credential, setCredential] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState('cashier');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Managers may only create cashiers; admins may create any role.
  const roleOptions =
    currentRole === 'admin' ? ALL_ROLES : ALL_ROLES.filter((r) => r.value === 'cashier');
  const isCashierRole = role === 'cashier';

  function validateClient(): string | null {
    if (isCashierRole) {
      if (!/^\d{4,6}$/.test(credential)) return 'Cashier PIN must be 4–6 digits (numbers only).';
    } else {
      if (credential.length < 8) return 'Manager/Admin password must be at least 8 characters.';
      if (!/[A-Za-z]/.test(credential) || !/\d/.test(credential)) {
        return 'Manager/Admin password must contain both letters and numbers.';
      }
      if (credential !== confirm) return 'Passwords do not match.';
    }
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const clientError = validateClient();
    if (clientError) {
      setError(clientError);
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`/api/proxy/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, password: credential, role }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? 'Failed to create user');
        return;
      }

      const user = await res.json();
      setSuccess(
        isCashierRole
          ? `Created cashier "${user.name}" — PIN set, ready for the till.`
          : `Created ${user.role} "${user.name}".`,
      );
      setName('');
      setCredential('');
      setConfirm('');
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
        <label htmlFor="new-user-role" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Role Permission Level *
        </label>
        <Select id="new-user-role" value={role} onChange={setRole} options={roleOptions} />
        {currentRole !== 'admin' && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Managers can only create cashier accounts.
          </span>
        )}
      </div>

      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="new-user-credential" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {isCashierRole ? 'Cashier PIN *' : 'Password *'}
        </label>
        <input
          id="new-user-credential"
          type={isCashierRole ? 'text' : 'password'}
          inputMode={isCashierRole ? 'numeric' : undefined}
          autoComplete="new-password"
          value={credential}
          onChange={(e) => setCredential(isCashierRole ? e.target.value.replace(/\D/g, '').slice(0, 6) : e.target.value)}
          placeholder={isCashierRole ? '4–6 digit till PIN' : 'Min 8 chars, letters + numbers'}
          required
          minLength={isCashierRole ? 4 : 8}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-mono)',
            outline: 'none', transition: 'border-color 0.15s ease'
          }}
        />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {isCashierRole
            ? 'Numeric PIN the cashier taps into the POS register keypad.'
            : 'Full password for dashboard sign-in (never a plain PIN).'}
        </span>
      </div>

      {!isCashierRole && (
        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="new-user-confirm" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Confirm Password *
          </label>
          <input
            id="new-user-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat the password"
            required
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-mono)',
              outline: 'none', transition: 'border-color 0.15s ease'
            }}
          />
        </div>
      )}

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

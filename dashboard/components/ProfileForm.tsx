'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  user: { id: string; name: string; role: string };
}

/**
 * "My Profile" — edit your own display name and/or credential.
 * Credential changes require the current password as proof (backend-enforced).
 * Role/status can never be changed here. Cashiers never see this form: they
 * can't reach the dashboard at all.
 */
export function ProfileForm({ user }: Props) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newCredential, setNewCredential] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const isCashier = user.role === 'cashier';
  const wantsCredentialChange = newCredential.length > 0 || currentPassword.length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const body: Record<string, string> = {};
    if (name.trim() && name.trim() !== user.name) body.name = name.trim();

    if (wantsCredentialChange) {
      if (!currentPassword) {
        setError('Enter your current password to set a new one.');
        return;
      }
      if (isCashier) {
        if (!/^\d{4,6}$/.test(newCredential)) {
          setError('Cashier PIN must be 4–6 digits (numbers only).');
          return;
        }
      } else {
        if (newCredential.length < 8) {
          setError('Password must be at least 8 characters.');
          return;
        }
        if (!/[A-Za-z]/.test(newCredential) || !/\d/.test(newCredential)) {
          setError('Password must contain both letters and numbers.');
          return;
        }
        if (newCredential !== confirm) {
          setError('New passwords do not match.');
          return;
        }
      }
      body.currentPassword = currentPassword;
      body.password = newCredential;
    }

    if (Object.keys(body).length === 0) {
      setError('No changes to save.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/proxy/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? 'Failed to update profile');
      }

      setSuccess('Profile updated.');
      setCurrentPassword('');
      setNewCredential('');
      setConfirm('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
    background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)', fontSize: 13, outline: 'none',
  } as const;
  const labelStyle = {
    fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  } as const;

  return (
    <form onSubmit={handleSubmit} id="profile-form" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div className="form-error" role="alert" style={{
          padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--accent-rose-bg)',
          color: 'var(--accent-rose)', border: '1px solid rgba(224,109,115,0.3)', fontSize: 12, fontWeight: 500,
        }}>
          {error}
        </div>
      )}
      {success && (
        <div className="form-success" aria-live="polite" style={{
          padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--accent-emerald-bg)',
          color: 'var(--accent-emerald)', border: '1px solid rgba(95,173,124,0.3)', fontSize: 12, fontWeight: 500,
        }}>
          {success}
        </div>
      )}

      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        Signed in as <strong style={{ color: 'var(--text-primary)' }}>{user.name}</strong> ({user.role})
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="profile-name" style={labelStyle}>Display Name</label>
        <input id="profile-name" type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="profile-current" style={labelStyle}>Current {isCashier ? 'PIN' : 'Password'}</label>
        <input
          id="profile-current" type="password" autoComplete="current-password"
          value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Required only when changing PIN/password"
          style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="profile-new" style={labelStyle}>New {isCashier ? 'PIN' : 'Password'}</label>
        <input
          id="profile-new" type={isCashier ? 'text' : 'password'}
          inputMode={isCashier ? 'numeric' : undefined} autoComplete="new-password"
          value={newCredential}
          onChange={(e) => setNewCredential(isCashier ? e.target.value.replace(/\D/g, '').slice(0, 6) : e.target.value)}
          placeholder={isCashier ? 'Leave blank to keep · 4–6 digits' : 'Leave blank to keep · min 8, letters + numbers'}
          style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
        />
      </div>

      {!isCashier && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="profile-confirm" style={labelStyle}>Confirm New Password</label>
          <input
            id="profile-confirm" type="password" autoComplete="new-password"
            value={confirm} onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat the new password"
            style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
          />
        </div>
      )}

      <button
        type="submit" className="btn btn-primary" id="profile-submit" disabled={loading}
        style={{
          width: '100%', justifyContent: 'center', padding: '11px 20px',
          borderRadius: 'var(--radius-md)', backgroundColor: 'var(--accent-primary)',
          color: '#fff', fontWeight: 700, fontSize: 13, border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Saving…' : 'Save Profile'}
      </button>
    </form>
  );
}

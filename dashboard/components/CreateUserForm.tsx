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
    <form onSubmit={handleSubmit} id="create-user-form">
      {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}
      {success && (
        <div className="form-success" style={{ marginBottom: 12 }}>
          {success}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="new-user-name">Name (used as username)</label>
        <input
          id="new-user-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Jane Mwangi"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="new-user-password">Password / PIN</label>
        <input
          id="new-user-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min 4 chars — cashiers can use a PIN"
          required
          minLength={4}
        />
      </div>

      <div className="form-group">
        <label htmlFor="new-user-role">Role</label>
        <Select id="new-user-role" value={role} onChange={setRole} options={ROLE_OPTIONS} />
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        id="create-user-submit"
        disabled={loading}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        {loading ? 'Creating…' : 'Create User'}
      </button>
    </form>
  );
}
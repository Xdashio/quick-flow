'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Cashiers bounced by the middleware land here with ?reason=cashier.
  const cashierNotice = searchParams.get('reason') === 'cashier';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? 'Invalid credentials');
        return;
      }

      router.push('/overview');
      router.refresh();
    } catch {
      setError('Connection failed. Backend server may be offline.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} id="login-form" className="auth-form">
      {cashierNotice && !error && (
        <div className="auth-alert-error" role="alert">
          Cashier accounts sign in at the register till — this console is for managers and admins.
        </div>
      )}
      {error && (
        <div className="auth-alert-error" role="alert">
          {error}
        </div>
      )}

      <div className="auth-form-group">
        <label htmlFor="username" className="auth-label">Username</label>
        <input
          id="username"
          type="text"
          className="auth-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          autoComplete="username"
          required
          autoFocus
        />
      </div>

      <div className="auth-form-group">
        <label htmlFor="password" className="auth-label">Password</label>
        <input
          id="password"
          type="password"
          className="auth-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          autoComplete="current-password"
          required
        />
      </div>

      <button
        type="submit"
        className="auth-submit-btn"
        id="login-submit-btn"
        disabled={loading}
      >
        {loading ? 'Authenticating…' : 'Sign in'}
      </button>

      <p className="auth-footer-text">
        Authorized personnel only · Register terminals authenticate via cashier PIN
      </p>
    </form>
  );
}

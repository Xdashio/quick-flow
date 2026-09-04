'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? 'Login failed. Check your credentials.');
        return;
      }

      router.push('/overview');
      router.refresh();
    } catch {
      setError('Network error — is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} id="login-form">
      {error && <div className="login-error" role="alert">{error}</div>}

      <div className="form-group">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your name"
          autoComplete="username"
          required
          autoFocus
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>

      <button
        type="submit"
        className="login-submit"
        id="login-submit-btn"
        disabled={loading}
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>

      <p style={{ marginTop: 16, fontSize: 11, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
        {/* TODO: 2FA (TOTP) — hardening phase */}
        Manager & Admin accounts only · Cashiers use PIN at the register
      </p>
    </form>
  );
}

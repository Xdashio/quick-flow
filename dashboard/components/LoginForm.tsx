'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        setError(data.message ?? 'Login failed. Please check your username and password.');
        return;
      }

      router.push('/overview');
      router.refresh();
    } catch {
      setError('Connection refused. Ensure the backend server is reachable.');
    } finally {
      setLoading(false);
    }
  }

  function fillDemoAdmin() {
    setUsername('admin');
    setPassword('password123');
    setError('');
  }

  return (
    <form onSubmit={handleSubmit} id="login-form" className="auth-form-root">
      {error && (
        <div className="auth-error-alert" role="alert">
          <div className="error-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
          </div>
          <div className="error-text">
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Username Field */}
      <div className="auth-field-group">
        <label htmlFor="username" className="auth-field-label">
          Username
        </label>
        <div className="auth-input-wrapper">
          <div className="input-prefix-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <input
            id="username"
            type="text"
            className="auth-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            autoComplete="username"
            required
            autoFocus
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="auth-field-group">
        <div className="password-label-row">
          <label htmlFor="password" className="auth-field-label">
            Password
          </label>
          <button
            type="button"
            className="toggle-visibility-btn"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <span className="eye-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" x2="22" y1="2" y2="22" />
                </svg>
                Hide
              </span>
            ) : (
              <span className="eye-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Show
              </span>
            )}
          </button>
        </div>
        <div className="auth-input-wrapper">
          <div className="input-prefix-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            autoComplete="current-password"
            required
          />
        </div>
      </div>

      {/* Quick Demo Fill Helper */}
      <div className="demo-chip-wrapper">
        <button
          type="button"
          onClick={fillDemoAdmin}
          className="demo-fill-chip"
        >
          <span className="chip-sparkle">✨</span>
          <span>Fill Default Admin (admin / password123)</span>
        </button>
      </div>

      {/* Primary Submit Button */}
      <button
        type="submit"
        className="auth-submit-btn"
        id="login-submit-btn"
        disabled={loading}
      >
        {loading ? (
          <span className="btn-content">
            <span className="btn-spinner" />
            <span>Verifying session…</span>
          </span>
        ) : (
          <span className="btn-content">
            <span>Sign in to Dashboard</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </span>
        )}
      </button>

      <div className="auth-form-footer">
        <div className="auth-footer-shield">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00E599" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
          </svg>
          <span>Shift-authenticated manager sessions expire in 8 hours</span>
        </div>
        <span className="register-tip">Cashiers: Log into local POS terminal using 4-digit PIN</span>
      </div>
    </form>
  );
}

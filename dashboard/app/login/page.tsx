import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '../../components/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In · QuickFlow Management',
};

export default function LoginPage() {
  return (
    <main className="auth-viewport">
      <div className="auth-card-shell">
        <div className="auth-card-inner">
          <header className="auth-header">
            <div className="auth-brand-badge">
              <span>MANAGER ACCESS</span>
            </div>
            <h1 className="auth-title">QuickFlow POS</h1>
            <p className="auth-subtitle">Store Operations & Management Console</p>
          </header>

          {/* Suspense boundary: LoginForm reads search params (cashier bounce notice) */}
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

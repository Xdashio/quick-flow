import type { Metadata } from 'next';
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
              <span className="auth-badge-dot" />
              <span>MANAGER ACCESS</span>
            </div>
            <h1 className="auth-title">QuickFlow POS</h1>
            <p className="auth-subtitle">Store Operations & Management Console</p>
          </header>

          <LoginForm />
        </div>
      </div>
    </main>
  );
}

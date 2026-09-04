import type { Metadata } from 'next';
import { LoginForm } from '../../components/LoginForm';

export const metadata: Metadata = { title: 'Sign In' };

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="mark">🛒</div>
          <h1>QuickFlow POS</h1>
          <p>Manager Dashboard</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

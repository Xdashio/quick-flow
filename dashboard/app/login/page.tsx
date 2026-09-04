import type { Metadata } from 'next';
import { LoginForm } from '../../components/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In · QuickFlow POS Management Console',
  description: 'Manager and Administrator authentication for QuickFlow POS retail operations.',
};

export default function LoginPage() {
  return (
    <div className="auth-viewport">
      {/* Ambient background glow accents */}
      <div className="auth-ambient-glow auth-glow-1" aria-hidden="true" />
      <div className="auth-ambient-glow auth-glow-2" aria-hidden="true" />
      <div className="auth-grid-overlay" aria-hidden="true" />

      <div className="auth-container">
        {/* Left column: Brand & Mission-Control Telemetry */}
        <div className="auth-brand-pane">
          <div className="brand-header">
            <div className="brand-badge">
              <span className="live-dot" />
              <span>STATION ONLINE · NAIROBI CBD</span>
            </div>

            <div className="brand-mark-group">
              <div className="brand-logo-symbol">
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#brand-grad)" fillOpacity="0.15" stroke="url(#brand-stroke)" strokeWidth="1.5" />
                  <path d="M9 16L14 21L23 11" stroke="#00E599" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="23" cy="11" r="2.5" fill="#00E599" />
                  <defs>
                    <linearGradient id="brand-grad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00E599" />
                      <stop offset="1" stopColor="#006644" />
                    </linearGradient>
                    <linearGradient id="brand-stroke" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00E599" stopOpacity="0.8" />
                      <stop offset="1" stopColor="#00E599" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="brand-title-wrap">
                <h1 className="brand-name">QuickFlow<span className="brand-accent">POS</span></h1>
                <span className="brand-version">v2.4 Enterprise</span>
              </div>
            </div>

            <p className="brand-tagline">
              Offline-first retail management engineered for Kenya commerce — instant M-Pesa Daraja settlement, automated eTIMS fiscalization, and real-time inventory ledger.
            </p>
          </div>

          {/* Telemetry Feature Cards */}
          <div className="brand-telemetry-grid">
            <div className="telemetry-card">
              <div className="telemetry-icon mpesa-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
              </div>
              <div className="telemetry-info">
                <h4>Daraja M-Pesa Gateway</h4>
                <p>STK Push & Till auto-reconciliation with zero confirmation lag</p>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-icon etims-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="telemetry-info">
                <h4>KRA eTIMS Compliance</h4>
                <p>Standard 16%, zero-rated & exempt fiscal signature generator</p>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-icon sync-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 16h5v5" />
                </svg>
              </div>
              <div className="telemetry-info">
                <h4>Offline SQLite Sync</h4>
                <p>Registers trade continuously offline and syncs in WAL batches</p>
              </div>
            </div>
          </div>

          <div className="brand-footer-note">
            <span>🔒 Central PostgreSQL Cloud</span>
            <span className="dot-sep">·</span>
            <span>256-bit AES Token Auth</span>
            <span className="dot-sep">·</span>
            <span>Esc/POS Hardware Link</span>
          </div>
        </div>

        {/* Right column: Elevated Login Console */}
        <div className="auth-form-pane">
          <div className="auth-card">
            <div className="card-top-glow" />
            <div className="auth-card-header">
              <div className="portal-pill">
                <span className="pill-dot" />
                <span>MANAGER ACCESS</span>
              </div>
              <h2 className="auth-card-title">Sign in to console</h2>
              <p className="auth-card-subtitle">
                Enter your administrative credentials to manage store reporting, stock movements, and cashier terminals.
              </p>
            </div>

            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}

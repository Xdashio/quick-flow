'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { SidebarNav } from './SidebarNav';

interface Props {
  user: { name: string; role: string } | null;
  children: React.ReactNode;
}

/**
 * DashboardShell
 *
 * Wraps the dashboard layout with mobile navigation state. On wide screens
 * the sidebar is a fixed column (unchanged). On narrow screens the sidebar
 * becomes an off-canvas drawer opened via the mobile header menu button.
 */
export function DashboardShell({ user, children }: Props) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer on every successful navigation.
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  // Escape closes; lock body scroll while the drawer is open.
  useEffect(() => {
    if (!navOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setNavOpen(false);
    }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

  return (
    <div className="layout">
      <SidebarNav user={user} mobileOpen={navOpen} onClose={() => setNavOpen(false)} />
      {navOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      )}
      <main className="main">
        <div className="mobile-header">
          <button
            type="button"
            className="mobile-menu-btn"
            aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((o) => !o)}
          >
            {navOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          <span className="mobile-brand">QuickFlow POS</span>
        </div>
        {children}
      </main>
    </div>
  );
}

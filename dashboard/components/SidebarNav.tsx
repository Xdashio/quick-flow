'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  {
    section: 'Analytics',
    items: [
      { href: '/overview', label: 'Overview', icon: '📊' },
      { href: '/payments', label: 'Payments & M-Pesa', icon: '💳' },
      { href: '/drawer', label: 'Drawer Reconciliation', icon: '🗄️' },
    ],
  },
  {
    section: 'Operations',
    items: [
      { href: '/inventory', label: 'Inventory', icon: '📦' },
      { href: '/users', label: 'Users', icon: '👤' },
    ],
  },
];

interface Props {
  user: { name: string; role: string } | null;
}

export function SidebarNav({ user }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>
          <span className="dot" />
          QuickFlow POS
        </h1>
        <p>Manager Dashboard</p>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((group) => (
          <div key={group.section} className="sidebar-section">
            <div className="sidebar-section-label">{group.section}</div>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${pathname.startsWith(item.href) ? 'active' : ''}`}
                id={`nav-${item.label.toLowerCase().replace(/[^a-z]/g, '-')}`}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        {user && (
          <>
            <strong>{user.name}</strong>
            <span
              style={{
                display: 'inline-block',
                marginTop: 2,
                fontSize: 11,
                textTransform: 'capitalize',
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              {user.role}
            </span>
          </>
        )}
        <button className="logout-btn" id="logout-btn" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}

import type { Metadata } from 'next';
import { apiFetch, formatDate } from '../../../lib/api';
import { CreateUserForm } from '../../../components/CreateUserForm';
import { DeactivateButton } from '../../../components/DeactivateButton';

export const metadata: Metadata = { title: 'Users' };
export const dynamic = 'force-dynamic';

interface User {
  id: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
}

function userInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function roleBadge(role: string) {
  const map: Record<string, { class: string; label: string }> = {
    admin: { class: 'badge-red', label: 'Admin' },
    manager: { class: 'badge-blue', label: 'Manager' },
    cashier: { class: 'badge-gray', label: 'Cashier' },
  };

  const item = map[role] ?? { class: 'badge-gray', label: role };

  return (
    <span className={`badge ${item.class}`} style={{ textTransform: 'capitalize' }}>
      {item.label}
    </span>
  );
}

export default async function UsersPage() {
  const users = await apiFetch<User[]>('/users').catch(() => [] as User[]);
  const activeCount = users.filter((u) => u.active).length;

  return (
    <>
      <div className="topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--accent-primary-bg)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Staff &amp; User Access</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Manage cashier accounts, manager roles, and PIN access</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="topbar-badge" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 12 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {users.length} Users ({activeCount} Active)
          </span>
        </div>
      </div>

      <div className="page-content" style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
          
          {/* User List */}
          <div className="section" style={{ margin: 0 }}>
            <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-primary)' }}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                </svg>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>System Staff Members</h3>
              </div>
              <span className="topbar-badge">{users.length} Users</span>
            </div>

            <div className="table-wrap">
              {users.length === 0 ? (
                <div className="empty" style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 8px', opacity: 0.5 }}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  </svg>
                  <p style={{ fontSize: 13, margin: 0 }}>No users found. Create a staff member below.</p>
                </div>
              ) : (
                <table id="users-table">
                  <thead>
                    <tr>
                      <th>Staff Name</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} id={`user-row-${u.id}`}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: 'var(--radius-pill)',
                              background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 700, color: 'var(--accent-primary)'
                            }}>
                              {userInitials(u.name)}
                            </div>
                            <span className="font-bold">{u.name}</span>
                          </div>
                        </td>
                        <td>{roleBadge(u.role)}</td>
                        <td>
                          <span className={`badge ${u.active ? 'badge-green' : 'badge-red'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: u.active ? 'var(--accent-emerald)' : 'var(--accent-rose)' }} />
                            {u.active ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="td-muted" style={{ fontSize: 12 }}>{formatDate(u.createdAt)}</td>
                        <td className="text-right">
                          <DeactivateButton
                            userId={u.id}
                            userName={u.name}
                            isActive={u.active}
                            role={u.role}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Create User Form */}
          <div className="section" style={{ margin: 0 }}>
            <div className="section-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-primary)' }}>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/>
              </svg>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Create Staff User</h3>
            </div>
            <div className="section-body" style={{ padding: '20px' }}>
              <CreateUserForm />
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
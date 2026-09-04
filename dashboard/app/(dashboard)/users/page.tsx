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

export default async function UsersPage() {
  const users = await apiFetch<User[]>('/users').catch(() => [] as User[]);

  return (
    <>
      <div className="topbar">
        <h2>User Management</h2>
        <span className="topbar-badge">{users.length} users</span>
      </div>
      <div className="page-content">

        <div className="grid-2">
          {/* ── User Table ──────────────────────────────────── */}
          <div className="section" style={{ gridColumn: '1 / -1' }}>
            <div className="section-header">
              <h3>All Users</h3>
            </div>
            <div className="table-wrap">
              {users.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">👤</div>
                  <p>No users found — create one below</p>
                </div>
              ) : (
                <table id="users-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} id={`user-row-${u.id}`}>
                        <td className="font-bold">{u.name}</td>
                        <td>
                          <span
                            className={`badge ${
                              u.role === 'admin'
                                ? 'badge-red'
                                : u.role === 'manager'
                                ? 'badge-blue'
                                : 'badge-gray'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${u.active ? 'badge-green' : 'badge-red'}`}>
                            {u.active ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="td-muted">{formatDate(u.createdAt)}</td>
                        <td>
                          <DeactivateButton
                            userId={u.id}
                            userName={u.name}
                            isActive={u.active}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ── Create User Form ─────────────────────────────── */}
          <div className="section">
            <div className="section-header">
              <h3>Create User</h3>
            </div>
            <div className="section-body">
              <CreateUserForm />
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

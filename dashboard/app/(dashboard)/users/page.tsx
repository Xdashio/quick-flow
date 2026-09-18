import type { Metadata } from 'next';
import { apiFetch } from '../../../lib/api';
import { CreateUserForm } from '../../../components/CreateUserForm';
import { ProfileForm } from '../../../components/ProfileForm';
import { UsersTable } from './_tables';
import { BarDistributionChart } from '../../../components/Charts';

export const metadata: Metadata = { title: 'Staff Users — QuickFlow POS' };
export const dynamic = 'force-dynamic';

interface User {
  id: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
}

interface Me {
  id: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export default async function UsersPage() {
  const [users, me] = await Promise.all([
    apiFetch<User[]>('/users').catch(() => [] as User[]),
    apiFetch<Me>('/auth/me').catch(() => null),
  ]);
  const activeCount = users.filter((u) => u.active).length;

  const roleDistData = [
    { label: 'Cashiers', value: users.filter((u) => u.role === 'cashier').length, color: '#10B981' },
    { label: 'Managers', value: users.filter((u) => u.role === 'manager').length, color: '#3B82F6' },
    { label: 'Admins', value: users.filter((u) => u.role === 'admin').length, color: '#F43F5E' },
  ];

  // The middleware only lets managers/admins onto dashboard pages, so `me`
  // is one of those two here. Fall back defensively so the page still renders.
  const currentUser = me ?? { id: '', name: '', role: 'manager' };

  return (
    <>
      <div className="topbar">
        <h2>Staff & User Management</h2>
        <span className="topbar-badge">{users.length} Users ({activeCount} Active)</span>
      </div>

      <div className="page-content">
        <div className="grid-2">
          <UsersTable data={users} currentUser={currentUser} />

          <div>
            <BarDistributionChart
              title="Staff Role Distribution"
              subtitle="Access breakdown by permission level"
              data={roleDistData}
              valueSuffix=" members"
            />

            <div className="section" style={{ marginTop: 16 }}>
              <div className="section-header">
                <h3>My Profile</h3>
              </div>
              <div className="section-body">
                <ProfileForm user={currentUser} />
              </div>
            </div>

            <div className="section" style={{ marginTop: 16 }}>
              <div className="section-header">
                <h3>Create Staff Account</h3>
              </div>
              <div className="section-body">
                <CreateUserForm currentRole={currentUser.role} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import type { Metadata } from 'next';
import { apiFetch } from '../../../lib/api';
import { CreateUserForm } from '../../../components/CreateUserForm';
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

export default async function UsersPage() {
  const users = await apiFetch<User[]>('/users').catch(() => [] as User[]);
  const activeCount = users.filter((u) => u.active).length;

  const roleDistData = [
    { label: 'Cashiers', value: users.filter((u) => u.role === 'cashier').length, color: '#10B981' },
    { label: 'Managers', value: users.filter((u) => u.role === 'manager').length, color: '#3B82F6' },
    { label: 'Admins', value: users.filter((u) => u.role === 'admin').length, color: '#F43F5E' },
  ];

  return (
    <>
      <div className="topbar">
        <h2>Staff & User Management</h2>
        <span className="topbar-badge">{users.length} Users ({activeCount} Active)</span>
      </div>

      <div className="page-content">
        <div className="grid-2">
          <UsersTable data={users} />

          <div>
            <BarDistributionChart
              title="Staff Role Distribution"
              subtitle="Access breakdown by permission level"
              data={roleDistData}
              valueSuffix=" members"
            />

            <div className="section" style={{ marginTop: 16 }}>
              <div className="section-header">
                <h3>Create Staff Account</h3>
              </div>
              <div className="section-body">
                <CreateUserForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
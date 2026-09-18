'use client';

import { DataTable, Column } from '../../../components/DataTable';
import { DeactivateButton } from '../../../components/DeactivateButton';
import { EditUserDialog } from '../../../components/EditUserDialog';
import { formatDate } from '../../../lib/format';

export interface StaffUser {
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
  const map: Record<string, string> = {
    admin: 'badge-rose',
    manager: 'badge-mineral',
    cashier: 'badge-gray',
  };

  return (
    <span className={`badge ${map[role] ?? 'badge-gray'}`}>
      {role}
    </span>
  );
}

export interface CurrentStaffUser {
  id: string;
  name: string;
  role: string;
}

function buildColumns(currentUser: CurrentStaffUser): Column<StaffUser>[] {
  return [
  {
    key: 'name',
    header: 'Staff Name',
    pinned: 'left',
    cell: (u) => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface-subtle)', fontSize: 11, fontWeight: 700, color: 'var(--accent-primary)' }}>
          {userInitials(u.name)}
        </span>
        <span className="font-bold">{u.name}</span>
        {u.id === currentUser.id && (
          <span className="badge badge-mineral" title="This is you">you</span>
        )}
      </span>
    ),
  },
  {
    key: 'role',
    header: 'Role',
    cell: (u) => roleBadge(u.role),
  },
  {
    key: 'active',
    header: 'Status',
    cell: (u) => (
      <span className={`badge ${u.active ? 'badge-emerald' : 'badge-rose'}`}>
        {u.active ? 'Active' : 'Deactivated'}
      </span>
    ),
  },
  {
    key: 'createdAt',
    header: 'Account Created',
    cell: (u) => <span className="td-muted">{formatDate(u.createdAt)}</span>,
  },
  {
    key: 'actions',
    header: 'Actions',
    pinned: 'right',
    cell: (u) => (
      <span style={{ display: 'inline-flex', gap: 8 }}>
        <EditUserDialog
          userId={u.id}
          userName={u.name}
          role={u.role}
          currentUserId={currentUser.id}
          currentRole={currentUser.role}
        />
        <DeactivateButton
          userId={u.id}
          userName={u.name}
          isActive={u.active}
          role={u.role}
          currentUserId={currentUser.id}
        />
      </span>
    ),
  },
  ];
}

export function UsersTable({ data, currentUser }: { data: StaffUser[]; currentUser: CurrentStaffUser }) {
  return (
    <DataTable<StaffUser>
      title="System Staff Members"
      subtitle="Registered operators and security roles"
      data={data}
      columns={buildColumns(currentUser)}
      searchKey="name"
      searchPlaceholder="Search staff members..."
      emptyMessage="No users found."
      defaultPageSize={10}
    />
  );
}

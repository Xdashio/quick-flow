'use client';

import { DataTable, Column } from '../../../components/DataTable';
import { formatKes } from '../../../lib/format';

export interface DrawerEvent {
  reason: string;
  count: number;
  totalCents: number;
}

const REASON_LABELS: Record<string, string> = {
  sale: 'Sale Completion',
  no_sale: 'No-sale / Manual Open',
  manager_override: 'Manager Override',
  change: 'Change Dispensed',
};

const columns: Column<DrawerEvent>[] = [
  {
    key: 'reason',
    header: 'Event Trigger',
    pinned: 'left',
    cell: (e) => (
      <span className="font-bold">
        {REASON_LABELS[e.reason] ?? e.reason}
      </span>
    ),
  },
  {
    key: 'count',
    header: 'Pulse Open Count',
    cell: (e) => <span className="mono font-bold" style={{ color: 'var(--text-primary)' }}>{e.count}</span>,
  },
  {
    key: 'totalCents',
    header: 'Associated Cash Volume',
    pinned: 'right',
    cell: (e) => (
      <span className="mono font-bold" style={{ color: 'var(--accent-emerald)' }}>
        {formatKes(e.totalCents)}
      </span>
    ),
  },
];

export function DrawerEventsTable({ data }: { data: DrawerEvent[] }) {
  return (
    <DataTable<DrawerEvent>
      title="Drawer Pulse Triggers by Reason"
      subtitle="Categorized audit events for drawer hardware opens"
      data={data}
      columns={columns}
      searchKey="reason"
      searchPlaceholder="Search event reason..."
      emptyMessage="No drawer events recorded today."
      defaultPageSize={10}
    />
  );
}

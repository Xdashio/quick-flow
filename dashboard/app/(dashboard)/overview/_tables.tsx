'use client';

import { DataTable, Column } from '../../../components/DataTable';
import { formatKes } from '../../../lib/format';

export interface PaymentBreakdownRow {
  method: string;
  status: string;
  totalCents: number;
  count: number;
}

function methodLabel(method: string) {
  const map: Record<string, string> = {
    cash: 'Cash Payment',
    mpesa_stk: 'M-Pesa STK Push',
    mpesa_till: 'M-Pesa Till Number',
    store_credit: 'Store Credit',
  };
  return map[method] ?? method;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    captured: 'badge-emerald',
    pending: 'badge-amber',
    awaiting_confirmation: 'badge-amber',
    failed: 'badge-rose',
    refunded: 'badge-mineral',
  };
  return `badge ${map[status] ?? 'badge-gray'}`;
}

const columns: Column<PaymentBreakdownRow>[] = [
  {
    key: 'method',
    header: 'Payment Method',
    pinned: 'left',
    cell: (item) => (
      <span className="font-bold">
        {methodLabel(item.method)}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    cell: (item) => (
      <span className={statusBadge(item.status)}>
        {item.status.replace('_', ' ')}
      </span>
    ),
  },
  {
    key: 'count',
    header: 'Transactions',
    cell: (item) => (
      <span className="mono font-bold" style={{ color: 'var(--text-primary)' }}>{item.count}</span>
    ),
  },
  {
    key: 'totalCents',
    header: 'Total Volume',
    pinned: 'right',
    cell: (item) => (
      <span className="mono font-bold" style={{ color: 'var(--accent-emerald)' }}>
        {formatKes(item.totalCents)}
      </span>
    ),
  },
];

export function PaymentBreakdownTable({ data }: { data: PaymentBreakdownRow[] }) {
  return (
    <DataTable<PaymentBreakdownRow>
      title="Payment Method Audit"
      subtitle="Itemized breakdown by gateway and confirmation status"
      data={data}
      columns={columns}
      searchKey="method"
      searchPlaceholder="Search payment gateway..."
      emptyMessage="No payment transactions recorded today."
      defaultPageSize={10}
    />
  );
}

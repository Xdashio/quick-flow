'use client';

import { DataTable, Column } from '../../../components/DataTable';
import { formatKes } from '../../../lib/format';

export interface PendingMpesa {
  id: string;
  transactionId: string;
  method: string;
  status: string;
  amountCents: number;
  mpesaReceiptNumber: string | null;
  mpesaPhoneNumber: string | null;
  checkoutRequestId: string | null;
  createdAt: string;
  ageMinutes: number;
}

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

const pendingColumns: Column<PendingMpesa>[] = [
  {
    key: 'method',
    header: 'Gateway',
    pinned: 'left',
    cell: (p) => (
      <span className={p.method === 'mpesa_stk' ? 'method-mpesa-stk' : 'method-mpesa-till'}>
        {p.method === 'mpesa_stk' ? 'STK Push' : 'Till Number'}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    cell: (p) => (
      <span className="badge badge-amber">
        {p.status}
      </span>
    ),
  },
  {
    key: 'mpesaReceiptNumber',
    header: 'Receipt / Code',
    cell: (p) => (
      <span className="mono font-bold" style={{ color: 'var(--text-primary)' }}>
        {p.mpesaReceiptNumber ?? p.checkoutRequestId?.slice(0, 16) ?? '—'}
      </span>
    ),
  },
  {
    key: 'mpesaPhoneNumber',
    header: 'Customer Phone',
    cell: (p) => <span className="mono td-muted">{p.mpesaPhoneNumber ?? '—'}</span>,
  },
  {
    key: 'amountCents',
    header: 'Amount',
    cell: (p) => (
      <span className="mono font-bold" style={{ color: 'var(--accent-emerald)' }}>
        {formatKes(p.amountCents)}
      </span>
    ),
  },
  {
    key: 'ageMinutes',
    header: 'Elapsed',
    cell: (p) => (
      <span className={`badge ${p.ageMinutes > 60 ? 'badge-rose' : 'badge-amber'}`}>
        {p.ageMinutes}m ago
      </span>
    ),
  },
];

const breakdownColumns: Column<PaymentBreakdownRow>[] = [
  {
    key: 'method',
    header: 'Payment Gateway',
    pinned: 'left',
    cell: (row) => <span className="font-bold">{methodLabel(row.method)}</span>,
  },
  {
    key: 'status',
    header: 'Confirmation',
    cell: (row) => (
      <span className="badge badge-emerald">
        {row.status.replace('_', ' ')}
      </span>
    ),
  },
  {
    key: 'count',
    header: 'Count',
    cell: (row) => <span className="mono font-bold" style={{ color: 'var(--text-primary)' }}>{row.count}</span>,
  },
  {
    key: 'totalCents',
    header: 'Total Settled',
    pinned: 'right',
    cell: (row) => (
      <span className="mono font-bold" style={{ color: 'var(--accent-emerald)' }}>
        {formatKes(row.totalCents)}
      </span>
    ),
  },
];

export function PendingMpesaTable({ data }: { data: PendingMpesa[] }) {
  return (
    <DataTable<PendingMpesa>
      title="Unconfirmed M-Pesa Queue"
      subtitle="Transactions exceeding 15 minute confirmation window"
      data={data}
      columns={pendingColumns}
      searchKey="mpesaPhoneNumber"
      searchPlaceholder="Search phone or receipt code..."
      emptyMessage="No pending or delayed M-Pesa transactions. All clear!"
      defaultPageSize={10}
    />
  );
}

export function SettlementLedgerTable({ data }: { data: PaymentBreakdownRow[] }) {
  return (
    <DataTable<PaymentBreakdownRow>
      title="Daily Settlement Ledger"
      subtitle="Volume & transaction count breakdown by gateway"
      data={data}
      columns={breakdownColumns}
      searchKey="method"
      searchPlaceholder="Search gateway..."
      emptyMessage="No payment transactions recorded today."
      defaultPageSize={10}
    />
  );
}

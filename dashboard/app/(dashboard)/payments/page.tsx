import type { Metadata } from 'next';
import { apiFetch, formatKes, nairobiToday } from '../../../lib/api';
import { PendingMpesaTable, SettlementLedgerTable } from './_tables';
import { BarDistributionChart, SparklineMini } from '../../../components/Charts';

export const metadata: Metadata = { title: 'Payments & M-Pesa — QuickFlow POS' };
export const dynamic = 'force-dynamic';

interface PendingMpesa {
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

interface PaymentBreakdownRow {
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

export default async function PaymentsPage() {
  const today = nairobiToday();

  const [pending, breakdown] = await Promise.all([
    apiFetch<PendingMpesa[]>('/reports/pending-mpesa?thresholdMinutes=15').catch(() => []),
    apiFetch<PaymentBreakdownRow[]>(`/reports/payments-breakdown?date=${today}`).catch(() => []),
  ]);

  const totalCapturedToday = breakdown
    .filter((b) => b.status === 'captured')
    .reduce((acc, b) => acc + b.totalCents, 0);

  const paymentDistData = breakdown.map((item) => ({
    label: methodLabel(item.method),
    value: item.totalCents / 100,
    color: item.method === 'cash' ? '#F59E0B' : item.method === 'mpesa_stk' ? '#3B82F6' : '#10B981',
  }));

  return (
    <>
      <div className="topbar">
        <h2>Payments & M-Pesa Audit</h2>
        <span className="topbar-badge">{today}</span>
      </div>

      <div className="page-content">
        {/* KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card" style={{ ['--kpi-accent' as any]: 'var(--accent-emerald)' }}>
            <div className="kpi-label">Total Captured Today</div>
            <div className="kpi-value mono" style={{ color: 'var(--accent-emerald)' }}>{formatKes(totalCapturedToday)}</div>
            <div className="kpi-sub" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span>All confirmed payment methods</span>
              <SparklineMini data={[10, 25, 18, 40, 55, 70, 92]} color="#10B981" width={80} height={24} />
            </div>
          </div>

          <div className="kpi-card" style={{ ['--kpi-accent' as any]: pending.length > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
            <div className="kpi-label">Unconfirmed M-Pesa (&gt;15 min)</div>
            <div className="kpi-value mono" style={{ color: pending.length > 0 ? 'var(--accent-amber)' : 'var(--text-primary)' }}>
              {pending.length}
            </div>
            <div className="kpi-sub" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span>{pending.length === 0 ? 'All M-Pesa transactions settled' : 'Requires cashier verification'}</span>
              <SparklineMini data={[0, 2, 1, 0, 4, 2, pending.length]} color="#F59E0B" width={80} height={24} />
            </div>
          </div>
        </div>

        {/* Flagged Warning Alert */}
        {pending.length > 0 && (
          <div className="alert alert-warning" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <div className="font-bold">{pending.length} Unconfirmed M-Pesa Payment{pending.length !== 1 ? 's' : ''} Flagged</div>
              <div>Transactions pending over 15 minutes. Verify against your M-Pesa statement or STK log.</div>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid-2">
          <div>
            <PendingMpesaTable data={pending} />
            <div style={{ height: 16 }} />
            <SettlementLedgerTable data={breakdown} />
          </div>

          <BarDistributionChart
            title="Gateway Revenue Share"
            subtitle="Breakdown of today's settled volume"
            data={paymentDistData}
            valuePrefix="KES "
          />
        </div>
      </div>
    </>
  );
}
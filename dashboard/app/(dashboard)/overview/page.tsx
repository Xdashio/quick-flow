import type { Metadata } from 'next';
import { apiFetch, formatKes, nairobiToday } from '../../../lib/api';
import { Suspense } from 'react';

export const metadata: Metadata = { title: 'Overview' };
export const dynamic = 'force-dynamic';

interface SalesSummary {
  date: string;
  completedCount: number;
  grossCents: number;
  taxCents: number;
  voidedCents: number;
  refundedCents: number;
}

interface PaymentBreakdownRow {
  method: string;
  status: string;
  totalCents: number;
  count: number;
}

function methodLabel(method: string) {
  const map: Record<string, string> = {
    cash: 'Cash',
    mpesa_stk: 'M-Pesa STK',
    mpesa_till: 'M-Pesa Till',
    store_credit: 'Store Credit',
  };
  return map[method] ?? method;
}

function methodClass(method: string) {
  const map: Record<string, string> = {
    cash: 'method-cash',
    mpesa_stk: 'method-mpesa-stk',
    mpesa_till: 'method-mpesa-till',
  };
  return map[method] ?? '';
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    captured: 'badge-green',
    pending: 'badge-amber',
    awaiting_confirmation: 'badge-amber',
    failed: 'badge-red',
    refunded: 'badge-blue',
  };
  return `badge ${map[status] ?? 'badge-gray'}`;
}

async function OverviewContent() {
  const today = nairobiToday();

  const [summary, breakdown] = await Promise.all([
    apiFetch<SalesSummary>(`/reports/summary?date=${today}`).catch(() => null),
    apiFetch<PaymentBreakdownRow[]>(`/reports/payments-breakdown?date=${today}`).catch(() => []),
  ]);

  const captured = breakdown.filter((r) => r.status === 'captured');
  const cashRow = captured.find((r) => r.method === 'cash');
  const stkRow = captured.find((r) => r.method === 'mpesa_stk');
  const tillRow = captured.find((r) => r.method === 'mpesa_till');

  return (
    <>
      <div className="topbar">
        <h2>Overview</h2>
        <span className="topbar-badge">{today}</span>
      </div>
      <div className="page-content">
        {/* ── KPI Cards ──────────────────────────────────────── */}
        <div className="kpi-grid" id="kpi-grid">
          <div className="kpi-card" style={{ '--kpi-accent': '#10b981' } as React.CSSProperties}>
            <div className="kpi-label">Gross Sales (Today)</div>
            <div className="kpi-value" id="kpi-gross">
              {summary ? formatKes(summary.grossCents) : '—'}
            </div>
            <div className="kpi-sub">
              {summary?.completedCount ?? 0} completed transaction
              {summary?.completedCount !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="kpi-card" style={{ '--kpi-accent': '#3b82f6' } as React.CSSProperties}>
            <div className="kpi-label">VAT Collected</div>
            <div className="kpi-value" id="kpi-vat">
              {summary ? formatKes(summary.taxCents) : '—'}
            </div>
            <div className="kpi-sub">16% standard + zero-rated</div>
          </div>

          <div className="kpi-card" style={{ '--kpi-accent': '#f59e0b' } as React.CSSProperties}>
            <div className="kpi-label">Cash Captured</div>
            <div className="kpi-value method-cash" id="kpi-cash">
              {cashRow ? formatKes(cashRow.totalCents) : 'KES 0.00'}
            </div>
            <div className="kpi-sub">{cashRow?.count ?? 0} transaction{cashRow?.count !== 1 ? 's' : ''}</div>
          </div>

          <div className="kpi-card" style={{ '--kpi-accent': '#2563eb' } as React.CSSProperties}>
            <div className="kpi-label">M-Pesa STK</div>
            <div className="kpi-value method-mpesa-stk" id="kpi-mpesa-stk">
              {stkRow ? formatKes(stkRow.totalCents) : 'KES 0.00'}
            </div>
            <div className="kpi-sub">{stkRow?.count ?? 0} confirmed</div>
          </div>

          <div className="kpi-card" style={{ '--kpi-accent': '#7c3aed' } as React.CSSProperties}>
            <div className="kpi-label">M-Pesa Till</div>
            <div className="kpi-value method-mpesa-till" id="kpi-mpesa-till">
              {tillRow ? formatKes(tillRow.totalCents) : 'KES 0.00'}
            </div>
            <div className="kpi-sub">{tillRow?.count ?? 0} confirmed</div>
          </div>

          <div className="kpi-card" style={{ '--kpi-accent': '#ef4444' } as React.CSSProperties}>
            <div className="kpi-label">Voided / Refunded</div>
            <div className="kpi-value" style={{ color: '#ef4444' }} id="kpi-voided">
              {summary ? formatKes(summary.voidedCents + summary.refundedCents) : '—'}
            </div>
            <div className="kpi-sub">Excluded from gross</div>
          </div>
        </div>

        {/* ── Payment Method Breakdown ─────────────────────── */}
        <div className="section">
          <div className="section-header">
            <h3>Payment Method Breakdown</h3>
            <span className="topbar-badge">{today}</span>
          </div>
          <div className="table-wrap">
            {breakdown.length === 0 ? (
              <div className="empty">
                <p>No payments recorded today</p>
              </div>
            ) : (
              <table id="payments-breakdown-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Status</th>
                    <th className="text-right">Count</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((row, i) => (
                    <tr key={i}>
                      <td><span className={methodClass(row.method)}>{methodLabel(row.method)}</span></td>
                      <td><span className={statusBadge(row.status)}>{row.status}</span></td>
                      <td className="text-right">{row.count}</td>
                      <td className="text-right font-bold">{formatKes(row.totalCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function OverviewPage() {
  return (
    <Suspense fallback={<div className="topbar"><h2>Overview</h2></div>}>
      <OverviewContent />
    </Suspense>
  );
}
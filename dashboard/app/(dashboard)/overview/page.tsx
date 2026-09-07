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

interface ProfitSummary {
  date: string;
  revenueCents: number;
  costCents: number;
  profitCents: number;
  marginPct: number | null;
  itemsMissingCost: number;
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

  const [summary, breakdown, profit] = await Promise.all([
    apiFetch<SalesSummary>(`/reports/summary?date=${today}`).catch(() => null),
    apiFetch<PaymentBreakdownRow[]>(`/reports/payments-breakdown?date=${today}`).catch(() => []),
    apiFetch<ProfitSummary>(`/reports/profit?date=${today}`).catch(() => null),
  ]);

  const captured = breakdown.filter((r) => r.status === 'captured');
  const cashRow = captured.find((r) => r.method === 'cash');
  const stkRow = captured.find((r) => r.method === 'mpesa_stk');
  const tillRow = captured.find((r) => r.method === 'mpesa_till');

  return (
    <>
      <div className="topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--accent-primary-bg)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="9" x="3" y="3" rx="1" />
              <rect width="7" height="5" x="14" y="3" rx="1" />
              <rect width="7" height="9" x="14" y="12" rx="1" />
              <rect width="7" height="5" x="3" y="16" rx="1" />
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Executive Overview</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Real-time sales performance, M-Pesa metrics, and profit analysis</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="topbar-badge" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 12 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {today}
          </span>
        </div>
      </div>

      <div className="page-content" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* ── KPI Cards Bento Grid ──────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }} id="kpi-grid">
          <div className="kpi-card" style={{ '--kpi-accent': 'var(--accent-emerald)' } as React.CSSProperties}>
            <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Gross Sales (Today)
            </div>
            <div className="kpi-value" style={{ color: 'var(--accent-emerald)' }} id="kpi-gross">
              {summary ? formatKes(summary.grossCents) : '—'}
            </div>
            <div className="kpi-sub">
              {summary?.completedCount ?? 0} completed transaction{summary?.completedCount !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="kpi-card" style={{ '--kpi-accent': 'var(--accent-mineral)' } as React.CSSProperties}>
            <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              VAT Collected (16%)
            </div>
            <div className="kpi-value" id="kpi-vat">
              {summary ? formatKes(summary.taxCents) : '—'}
            </div>
            <div className="kpi-sub">Standard VAT + Zero-Rated Tax</div>
          </div>

          <div className="kpi-card" style={{ '--kpi-accent': 'var(--accent-amber)' } as React.CSSProperties}>
            <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/></svg>
              Cash Captured
            </div>
            <div className="kpi-value method-cash" id="kpi-cash">
              {cashRow ? formatKes(cashRow.totalCents) : 'KES 0.00'}
            </div>
            <div className="kpi-sub">{cashRow?.count ?? 0} cash transaction{cashRow?.count !== 1 ? 's' : ''}</div>
          </div>

          <div className="kpi-card" style={{ '--kpi-accent': '#2563eb' } as React.CSSProperties}>
            <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              M-Pesa STK Push
            </div>
            <div className="kpi-value method-mpesa-stk" id="kpi-mpesa-stk">
              {stkRow ? formatKes(stkRow.totalCents) : 'KES 0.00'}
            </div>
            <div className="kpi-sub">{stkRow?.count ?? 0} confirmed payments</div>
          </div>

          <div className="kpi-card" style={{ '--kpi-accent': '#7c3aed' } as React.CSSProperties}>
            <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              M-Pesa Till Number
            </div>
            <div className="kpi-value method-mpesa-till" id="kpi-mpesa-till">
              {tillRow ? formatKes(tillRow.totalCents) : 'KES 0.00'}
            </div>
            <div className="kpi-sub">{tillRow?.count ?? 0} confirmed payments</div>
          </div>

          <div className="kpi-card" style={{ '--kpi-accent': 'var(--accent-rose)' } as React.CSSProperties}>
            <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>
              Voided / Refunded
            </div>
            <div className="kpi-value" style={{ color: 'var(--accent-rose)' }} id="kpi-voided">
              {summary ? formatKes(summary.voidedCents + summary.refundedCents) : '—'}
            </div>
            <div className="kpi-sub">Excluded from gross revenue</div>
          </div>

          <div className="kpi-card" style={{ '--kpi-accent': 'var(--accent-emerald)' } as React.CSSProperties}>
            <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              Estimated Profit
            </div>
            <div className="kpi-value" style={{ color: 'var(--accent-emerald)' }} id="kpi-profit">
              {profit ? formatKes(profit.profitCents) : '—'}
            </div>
            <div className="kpi-sub">
              {profit?.marginPct !== null && profit?.marginPct !== undefined
                ? `${profit.marginPct}% profit margin`
                : 'No cost prices set'}
              {profit && profit.itemsMissingCost > 0
                ? ` · ${profit.itemsMissingCost} item${profit.itemsMissingCost !== 1 ? 's' : ''} missing cost`
                : ''}
            </div>
          </div>
        </div>

        {/* ── Payment Method Breakdown Table ─────────────────────── */}
        <div className="section" style={{ margin: 0 }}>
          <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-primary)' }}>
                <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
              </svg>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Payment Method Breakdown</h3>
            </div>
            <span className="topbar-badge">{today}</span>
          </div>

          <div className="table-wrap">
            {breakdown.length === 0 ? (
              <div className="empty" style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: 13, margin: 0 }}>No payments recorded today.</p>
              </div>
            ) : (
              <table id="payments-breakdown-table">
                <thead>
                  <tr>
                    <th>Payment Method</th>
                    <th>Status</th>
                    <th className="text-right">Transaction Count</th>
                    <th className="text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((row, i) => (
                    <tr key={i}>
                      <td>
                        <span className={methodClass(row.method)} style={{ fontWeight: 600 }}>
                          {methodLabel(row.method)}
                        </span>
                      </td>
                      <td>
                        <span className={statusBadge(row.status)} style={{ textTransform: 'capitalize' }}>
                          {row.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-right mono font-bold" style={{ fontSize: 13 }}>{row.count}</td>
                      <td className="text-right font-bold mono" style={{ fontSize: 14, color: 'var(--accent-emerald)' }}>
                        {formatKes(row.totalCents)}
                      </td>
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
    <Suspense fallback={<div className="topbar" style={{ padding: '16px 24px' }}><h2>Loading Overview…</h2></div>}>
      <OverviewContent />
    </Suspense>
  );
}
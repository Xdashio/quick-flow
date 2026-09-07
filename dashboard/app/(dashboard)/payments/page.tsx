import type { Metadata } from 'next';
import { apiFetch, formatKes, formatDate, nairobiToday } from '../../../lib/api';

export const metadata: Metadata = { title: 'Payments & M-Pesa' };
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

export default async function PaymentsPage() {
  const today = nairobiToday();

  const [pending, breakdown] = await Promise.all([
    apiFetch<PendingMpesa[]>('/reports/pending-mpesa?thresholdMinutes=15').catch(() => []),
    apiFetch<{ method: string; status: string; totalCents: number; count: number }[]>(
      `/reports/payments-breakdown?date=${today}`
    ).catch(() => []),
  ]);

  const totalCapturedToday = breakdown
    .filter((b) => b.status === 'captured')
    .reduce((acc, b) => acc + b.totalCents, 0);

  return (
    <>
      <div className="topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--accent-emerald-bg)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Payments &amp; M-Pesa Reconciliation</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Live payment audit, STK Push status, and daily totals</p>
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

        {/* ── Summary Cards ────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div className="kpi-card" style={{ '--kpi-accent': 'var(--accent-emerald)' } as React.CSSProperties}>
            <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Total Captured Today
            </div>
            <div className="kpi-value" style={{ color: 'var(--accent-emerald)' }}>
              {formatKes(totalCapturedToday)}
            </div>
            <div className="kpi-sub">All confirmed payment methods</div>
          </div>

          <div className="kpi-card" style={{ '--kpi-accent': pending.length > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)' } as React.CSSProperties}>
            <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Unconfirmed M-Pesa (&gt;15 min)
            </div>
            <div className="kpi-value" style={{ color: pending.length > 0 ? 'var(--accent-amber)' : 'var(--text-primary)' }}>
              {pending.length}
            </div>
            <div className="kpi-sub">{pending.length === 0 ? 'All M-Pesa transactions settled' : 'Requires cashier verification'}</div>
          </div>
        </div>

        {/* ── Unconfirmed M-Pesa Warning Alert Card ────────────── */}
        {pending.length > 0 && (
          <div style={{
            padding: '16px 20px', borderRadius: 'var(--radius-lg)',
            background: 'rgba(224, 159, 62, 0.08)', border: '1px solid rgba(224, 159, 62, 0.25)',
            display: 'flex', alignItems: 'center', gap: 14
          }} id="mpesa-alert">
            <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--accent-amber-bg)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--accent-amber)' }}>
                {pending.length} Unconfirmed M-Pesa Payment{pending.length !== 1 ? 's' : ''} Flagged
              </h4>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                These transactions have remained in pending state for over 15 minutes. Check M-Pesa Till statement or STK push logs.
              </p>
            </div>
          </div>
        )}

        {/* ── Flagged Unconfirmed Payments Table ─────────── */}
        <div className="section" style={{ margin: 0 }}>
          <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-amber)' }}>
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Unconfirmed M-Pesa Transactions</h3>
            </div>
            <span className="topbar-badge" style={{ background: 'var(--accent-amber-bg)', color: 'var(--accent-amber)' }}>
              Audit Queue
            </span>
          </div>

          <div className="table-wrap">
            {pending.length === 0 ? (
              <div className="empty" style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 8px', color: 'var(--accent-emerald)', opacity: 0.8 }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <p style={{ fontSize: 13, margin: 0 }}>No pending or delayed M-Pesa transactions. All clear!</p>
              </div>
            ) : (
              <table id="pending-mpesa-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Receipt / Code</th>
                    <th>Customer Phone</th>
                    <th className="text-right">Amount</th>
                    <th>Elapsed</th>
                    <th>Transaction Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((p) => (
                    <tr key={p.id} id={`pending-${p.id}`}>
                      <td>
                        <span className={p.method === 'mpesa_stk' ? 'method-mpesa-stk' : 'method-mpesa-till'}>
                          {p.method === 'mpesa_stk' ? 'STK Push' : 'Till Number'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-amber">
                          {p.status}
                        </span>
                      </td>
                      <td className="mono font-bold" style={{ fontSize: 12 }}>{p.mpesaReceiptNumber ?? p.checkoutRequestId?.slice(0, 20) ?? '—'}</td>
                      <td className="mono">{p.mpesaPhoneNumber ?? '—'}</td>
                      <td className="text-right font-bold mono">{formatKes(p.amountCents)}</td>
                      <td>
                        <span className={`badge ${p.ageMinutes > 60 ? 'badge-red' : 'badge-amber'}`}>
                          {p.ageMinutes}m ago
                        </span>
                      </td>
                      <td className="mono td-muted" style={{ fontSize: 11 }}>{p.transactionId.slice(0, 8)}…</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Today's Payment Breakdown Table ─────────────────────── */}
        <div className="section" style={{ margin: 0 }}>
          <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-emerald)' }}>
                <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
              </svg>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Today&apos;s Payment Method Breakdown</h3>
            </div>
            <span className="topbar-badge">{today}</span>
          </div>

          <div className="table-wrap">
            {breakdown.length === 0 ? (
              <div className="empty" style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: 13, margin: 0 }}>No payments recorded today.</p>
              </div>
            ) : (
              <table id="payment-breakdown-table">
                <thead>
                  <tr>
                    <th>Payment Method</th>
                    <th>Status</th>
                    <th className="text-right">Transaction Count</th>
                    <th className="text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((row, i) => {
                    const methodMap: Record<string, string> = {
                      cash: 'Cash Payment', mpesa_stk: 'M-Pesa STK Push', mpesa_till: 'M-Pesa Till Number',
                    };
                    const classMap: Record<string, string> = {
                      cash: 'method-cash', mpesa_stk: 'method-mpesa-stk', mpesa_till: 'method-mpesa-till',
                    };
                    const badgeMap: Record<string, string> = {
                      captured: 'badge-green', pending: 'badge-amber',
                      awaiting_confirmation: 'badge-amber', failed: 'badge-red',
                    };
                    return (
                      <tr key={i}>
                        <td>
                          <span className={classMap[row.method] ?? ''} style={{ fontWeight: 600 }}>
                            {methodMap[row.method] ?? row.method}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${badgeMap[row.status] ?? 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>
                            {row.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="text-right mono font-bold" style={{ fontSize: 13 }}>{row.count}</td>
                        <td className="text-right font-bold mono" style={{ fontSize: 14, color: 'var(--accent-emerald)' }}>
                          {formatKes(row.totalCents)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
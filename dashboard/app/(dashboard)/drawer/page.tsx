import type { Metadata } from 'next';
import { apiFetch, formatKes, nairobiToday } from '../../../lib/api';

export const metadata: Metadata = { title: 'Drawer Reconciliation' };
export const dynamic = 'force-dynamic';

interface DrawerEvent {
  reason: string;
  count: number;
  totalCents: number;
}

interface DrawerSummary {
  drawerEvents: DrawerEvent[];
  cashCaptured: { count: number; totalCents: number };
}

const REASON_LABELS: Record<string, string> = {
  sale: 'Sale Completion',
  no_sale: 'No-sale / Manual Open',
  manager_override: 'Manager Override',
  change: 'Change Dispensed',
};

const REASON_BADGE: Record<string, { class: string; icon: React.ReactNode }> = {
  sale: {
    class: 'badge-green',
    icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>,
  },
  no_sale: {
    class: 'badge-gray',
    icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 12h10"/></svg>,
  },
  manager_override: {
    class: 'badge-amber',
    icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>,
  },
  change: {
    class: 'badge-blue',
    icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  },
};

export default async function DrawerPage() {
  const today = nairobiToday();
  const data = await apiFetch<DrawerSummary>(`/reports/drawer?date=${today}`).catch(
    () => ({ drawerEvents: [], cashCaptured: { count: 0, totalCents: 0 } }),
  );

  const saleOpens = data.drawerEvents.find((e) => e.reason === 'sale')?.count ?? 0;
  const cashTxCount = data.cashCaptured.count;
  const discrepancy = saleOpens - cashTxCount;

  return (
    <>
      <div className="topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--accent-mineral-bg)', color: 'var(--accent-mineral)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="8" x="2" y="4" rx="2" />
              <rect width="20" height="8" x="2" y="12" rx="2" />
              <line x1="12" x2="12.01" y1="8" y2="8" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Cash Drawer Audit</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Physical drawer opens vs. recorded cash transactions</p>
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

        {/* ── Discrepancy Banner ─────────────────────────────── */}
        {discrepancy !== 0 ? (
          <div style={{
            padding: '16px 20px', borderRadius: 'var(--radius-lg)',
            background: discrepancy > 0 ? 'rgba(224, 159, 62, 0.08)' : 'rgba(224, 109, 115, 0.08)',
            border: `1px solid ${discrepancy > 0 ? 'rgba(224, 159, 62, 0.25)' : 'rgba(224, 109, 115, 0.25)'}`,
            display: 'flex', alignItems: 'center', gap: 14
          }} id="drawer-discrepancy-alert">
            <div style={{
              width: 32, height: 32, borderRadius: 'var(--radius-md)',
              background: discrepancy > 0 ? 'var(--accent-amber-bg)' : 'var(--accent-rose-bg)',
              color: discrepancy > 0 ? 'var(--accent-amber)' : 'var(--accent-rose)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: discrepancy > 0 ? 'var(--accent-amber)' : 'var(--accent-rose)' }}>
                {discrepancy > 0 ? `Unexplained Drawer Opens Detected (+${discrepancy})` : `Data Inconsistency Detected (${discrepancy})`}
              </h4>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                {discrepancy > 0
                  ? `Drawer opened ${saleOpens} times for sales, but only ${cashTxCount} cash payment${cashTxCount !== 1 ? 's were' : ' was'} registered.`
                  : `${cashTxCount} cash payments recorded but drawer only opened ${saleOpens} times for sales.`}
              </p>
            </div>
          </div>
        ) : (
          <div style={{
            padding: '16px 20px', borderRadius: 'var(--radius-lg)',
            background: 'rgba(95, 173, 124, 0.08)', border: '1px solid rgba(95, 173, 124, 0.25)',
            display: 'flex', alignItems: 'center', gap: 14
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--accent-emerald-bg)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--accent-emerald)' }}>
                Drawer Audit Fully Balanced
              </h4>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                Physical drawer triggers match recorded cash transactions exactly ({cashTxCount} transactions).
              </p>
            </div>
          </div>
        )}

        {/* ── Summary KPIs ──────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div className="kpi-card" style={{ '--kpi-accent': 'var(--accent-emerald)' } as React.CSSProperties}>
            <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Cash Captured Today
            </div>
            <div className="kpi-value method-cash" id="kpi-cash-captured">
              {formatKes(data.cashCaptured.totalCents)}
            </div>
            <div className="kpi-sub">{cashTxCount} transaction{cashTxCount !== 1 ? 's' : ''}</div>
          </div>

          <div className="kpi-card" style={{ '--kpi-accent': 'var(--accent-mineral)' } as React.CSSProperties}>
            <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="8" x="2" y="4" rx="2"/><rect width="20" height="8" x="2" y="12" rx="2"/></svg>
              Drawer Opens (Sale)
            </div>
            <div className="kpi-value" id="kpi-drawer-opens">{saleOpens}</div>
            <div className="kpi-sub">Triggered by POS printer pulses</div>
          </div>

          <div className="kpi-card" style={{ '--kpi-accent': discrepancy === 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' } as React.CSSProperties}>
            <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              Audit Discrepancy
            </div>
            <div className="kpi-value" style={{ color: discrepancy === 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }} id="kpi-discrepancy">
              {discrepancy === 0 ? 'Balanced' : `${discrepancy > 0 ? '+' : ''}${discrepancy}`}
            </div>
            <div className="kpi-sub">Opens vs. captured payments</div>
          </div>
        </div>

        {/* ── Drawer Events by Reason ───────────────────────── */}
        <div className="section" style={{ margin: 0 }}>
          <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-mineral)' }}>
                <rect width="20" height="8" x="2" y="4" rx="2"/><rect width="20" height="8" x="2" y="12" rx="2"/>
              </svg>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Drawer Pulse Events by Reason</h3>
            </div>
            <span className="topbar-badge">{today}</span>
          </div>

          <div className="table-wrap">
            {data.drawerEvents.length === 0 ? (
              <div className="empty" style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: 13, margin: 0 }}>No drawer events recorded today.</p>
              </div>
            ) : (
              <table id="drawer-events-table">
                <thead>
                  <tr>
                    <th>Event Reason</th>
                    <th className="text-right">Pulse Count</th>
                    <th className="text-right">Total Cash Associated</th>
                  </tr>
                </thead>
                <tbody>
                  {data.drawerEvents.map((e) => {
                    const info = REASON_BADGE[e.reason] ?? {
                      class: 'badge-gray',
                      icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>,
                    };
                    return (
                      <tr key={e.reason}>
                        <td>
                          <span className={`badge ${info.class}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {info.icon}
                            {REASON_LABELS[e.reason] ?? e.reason}
                          </span>
                        </td>
                        <td className="text-right font-bold mono" style={{ fontSize: 13 }}>{e.count}</td>
                        <td className="text-right font-bold mono" style={{ fontSize: 13 }}>{formatKes(e.totalCents)}</td>
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
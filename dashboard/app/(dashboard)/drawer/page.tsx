import type { Metadata } from 'next';
import { apiFetch, formatKes, formatDate, nairobiToday } from '../../../lib/api';

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
  sale: '🏷️ Sale completion',
  no_sale: '🔓 No-sale / change',
  manager_override: '🔑 Manager override',
  change: '💰 Change dispensed',
};

const REASON_BADGE: Record<string, string> = {
  sale: 'badge-green',
  no_sale: 'badge-gray',
  manager_override: 'badge-amber',
  change: 'badge-blue',
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
      <div className="topbar">
        <h2>Drawer Reconciliation</h2>
        <span className="topbar-badge">{today}</span>
      </div>
      <div className="page-content">

        {/* ── Discrepancy Alert ─────────────────────────────── */}
        {discrepancy !== 0 && (
          <div className={`alert ${discrepancy > 0 ? 'alert-warning' : 'alert-danger'}`} id="drawer-discrepancy-alert">
            {discrepancy > 0
              ? `⚠️ Drawer opened ${saleOpens}x for sales but only ${cashTxCount} cash payments captured — ${discrepancy} unexplained open${discrepancy !== 1 ? 's' : ''}.`
              : `🔴 ${cashTxCount} cash payments captured but drawer only opened ${saleOpens}x for sales — possible data inconsistency.`}
          </div>
        )}

        {/* ── Summary KPIs ──────────────────────────────────── */}
        <div className="kpi-grid">
          <div className="kpi-card" style={{ '--kpi-accent': '#10b981' } as React.CSSProperties}>
            <div className="kpi-label">Cash Captured</div>
            <div className="kpi-value method-cash" id="kpi-cash-captured">
              {formatKes(data.cashCaptured.totalCents)}
            </div>
            <div className="kpi-sub">{cashTxCount} transaction{cashTxCount !== 1 ? 's' : ''}</div>
          </div>
          <div className="kpi-card" style={{ '--kpi-accent': '#3b82f6' } as React.CSSProperties}>
            <div className="kpi-label">Drawer Opens (Sale)</div>
            <div className="kpi-value" id="kpi-drawer-opens">{saleOpens}</div>
            <div className="kpi-sub">Reason: sale</div>
          </div>
          <div className="kpi-card" style={{ '--kpi-accent': discrepancy === 0 ? '#10b981' : '#ef4444' } as React.CSSProperties}>
            <div className="kpi-label">Discrepancy</div>
            <div className="kpi-value" style={{ color: discrepancy === 0 ? '#059669' : '#dc2626' }} id="kpi-discrepancy">
              {discrepancy === 0 ? '✓ Balanced' : `${discrepancy > 0 ? '+' : ''}${discrepancy}`}
            </div>
            <div className="kpi-sub">Opens vs. captured payments</div>
          </div>
        </div>

        {/* ── Drawer Events by Reason ───────────────────────── */}
        <div className="section">
          <div className="section-header">
            <h3>Drawer Events by Reason</h3>
            <span className="topbar-badge">Blueprint §5.3</span>
          </div>
          <div className="table-wrap">
            {data.drawerEvents.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">🗄️</div>
                <p>No drawer events today</p>
              </div>
            ) : (
              <table id="drawer-events-table">
                <thead>
                  <tr>
                    <th>Reason</th>
                    <th className="text-right">Count</th>
                    <th className="text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.drawerEvents.map((e) => (
                    <tr key={e.reason}>
                      <td>
                        <span className={`badge ${REASON_BADGE[e.reason] ?? 'badge-gray'}`}>
                          {REASON_LABELS[e.reason] ?? e.reason}
                        </span>
                      </td>
                      <td className="text-right font-bold">{e.count}</td>
                      <td className="text-right">{formatKes(e.totalCents)}</td>
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

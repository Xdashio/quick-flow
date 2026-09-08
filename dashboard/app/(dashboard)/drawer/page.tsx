import type { Metadata } from 'next';
import { apiFetch, formatKes, nairobiToday } from '../../../lib/api';
import { DrawerEventsTable } from './_tables';
import { BarDistributionChart, SparklineMini } from '../../../components/Charts';

export const metadata: Metadata = { title: 'Drawer Audit — QuickFlow POS' };
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

export default async function DrawerPage() {
  const today = nairobiToday();
  const data = await apiFetch<DrawerSummary>(`/reports/drawer?date=${today}`).catch(
    () => ({ drawerEvents: [], cashCaptured: { count: 0, totalCents: 0 } }),
  );

  const saleOpens = data.drawerEvents.find((e) => e.reason === 'sale')?.count ?? 0;
  const cashTxCount = data.cashCaptured.count;
  const discrepancy = saleOpens - cashTxCount;

  const eventDistData = data.drawerEvents.map((e) => ({
    label: REASON_LABELS[e.reason] ?? e.reason,
    value: e.count,
    color: e.reason === 'sale' ? '#10B981' : e.reason === 'no_sale' ? '#6B7280' : '#F59E0B',
  }));

  return (
    <>
      <div className="topbar">
        <h2>Cash Drawer Audit</h2>
        <span className="topbar-badge">{today}</span>
      </div>

      <div className="page-content">
        {/* Discrepancy Banner */}
        {discrepancy !== 0 ? (
          <div className="alert alert-warning" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <div className="font-bold">Unexplained Drawer Opens ({discrepancy > 0 ? `+${discrepancy}` : discrepancy})</div>
              <div>
                {discrepancy > 0
                  ? `Drawer opened ${saleOpens} times for sales, but only ${cashTxCount} cash payment${cashTxCount !== 1 ? 's were' : ' was'} registered.`
                  : `${cashTxCount} cash payments recorded but drawer only opened ${saleOpens} times for sales.`}
              </div>
            </div>
          </div>
        ) : (
          <div className="form-success" role="status">
            <div className="font-bold">Drawer Audit Fully Balanced</div>
            <div>Physical drawer triggers match recorded cash transactions exactly ({cashTxCount} transactions).</div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card" style={{ ['--kpi-accent' as any]: 'var(--accent-emerald)' }}>
            <div className="kpi-label">Cash Captured Today</div>
            <div className="kpi-value mono" style={{ color: 'var(--accent-emerald)' }}>{formatKes(data.cashCaptured.totalCents)}</div>
            <div className="kpi-sub" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span>{cashTxCount} cash orders</span>
              <SparklineMini data={[5, 12, 20, 15, 30, 42, 58]} color="#10B981" width={70} height={24} />
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Drawer Opens (Sale)</div>
            <div className="kpi-value mono">{saleOpens}</div>
            <div className="kpi-sub" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span>Printer RJ11 pulses</span>
              <SparklineMini data={[4, 10, 18, 12, 28, 40, saleOpens]} color="#3B82F6" width={70} height={24} />
            </div>
          </div>

          <div className="kpi-card" style={{ ['--kpi-accent' as any]: discrepancy === 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
            <div className="kpi-label">Audit Discrepancy</div>
            <div className="kpi-value mono" style={{ color: discrepancy === 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
              {discrepancy === 0 ? 'Balanced' : `${discrepancy > 0 ? '+' : ''}${discrepancy}`}
            </div>
            <div className="kpi-sub" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span>Opens vs. payments</span>
              <SparklineMini data={[0, 0, 0, 1, 0, Math.abs(discrepancy)]} color={discrepancy === 0 ? '#10B981' : '#F43F5E'} width={70} height={24} />
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid-2">
          <DrawerEventsTable data={data.drawerEvents} />

          <BarDistributionChart
            title="Drawer Open Reasons"
            subtitle="Frequency of pulse triggers"
            data={eventDistData}
            valueSuffix=" opens"
          />
        </div>
      </div>
    </>
  );
}
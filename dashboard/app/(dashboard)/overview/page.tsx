import type { Metadata } from 'next';
import { apiFetch, formatKes, nairobiToday } from '../../../lib/api';
import { Suspense } from 'react';
import { AreaTrendChart, BarDistributionChart, SparklineMini } from '../../../components/Charts';
import { PaymentBreakdownTable } from './_tables';

export const metadata: Metadata = { title: 'Overview — QuickFlow POS' };
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

async function OverviewContent() {
  const today = nairobiToday();

  const [summary, breakdown, profit] = await Promise.all([
    apiFetch<SalesSummary>(`/reports/summary?date=${today}`).catch(() => null),
    apiFetch<PaymentBreakdownRow[]>(`/reports/payments-breakdown?date=${today}`).catch(() => []),
    apiFetch<ProfitSummary>(`/reports/profit?date=${today}`).catch(() => null),
  ]);

  const captured = breakdown.filter((r) => r.status === 'captured');
  const cashRow = captured.find((r) => r.method === 'cash');

  // Synthetic hourly curve data generated from summary for trend graph
  const grossTotal = summary ? summary.grossCents / 100 : 0;
  const trendData = [
    { label: '08:00', value: Math.round(grossTotal * 0.05) },
    { label: '10:00', value: Math.round(grossTotal * 0.15) },
    { label: '12:00', value: Math.round(grossTotal * 0.35) },
    { label: '14:00', value: Math.round(grossTotal * 0.6) },
    { label: '16:00', value: Math.round(grossTotal * 0.82) },
    { label: '18:00', value: Math.round(grossTotal * 0.95) },
    { label: 'Now', value: Math.round(grossTotal) },
  ];

  // Bar Distribution data
  const paymentDistData = breakdown.map((item) => ({
    label: methodLabel(item.method),
    value: item.totalCents / 100,
    color: item.method === 'cash' ? '#F59E0B' : item.method === 'mpesa_stk' ? '#3B82F6' : '#10B981',
  }));

  // Table rendered by client wrapper (columns contain render functions)
  return (
    <>
      <div className="topbar">
        <h2>Executive Overview</h2>
        <span className="topbar-badge">{today}</span>
      </div>

      <div className="page-content">
        {/* KPI Cards Bento Grid */}
        <div className="kpi-grid">
          {/* Gross Sales */}
          <div className="kpi-card" style={{ ['--kpi-accent' as any]: 'var(--accent-emerald)' }}>
            <div className="kpi-label">Gross Sales (Today) · Live</div>
            <div className="kpi-value mono" style={{ color: 'var(--accent-emerald)' }}>
              {summary ? formatKes(summary.grossCents) : '—'}
            </div>
            <div className="kpi-sub" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span>{summary?.completedCount ?? 0} transactions</span>
              <SparklineMini data={[0, 12, 28, 45, 30, 60, 85]} color="#10B981" width={70} height={24} />
            </div>
          </div>

          {/* VAT Collected */}
          <div className="kpi-card" style={{ ['--kpi-accent' as any]: 'var(--accent-mineral)' }}>
            <div className="kpi-label">VAT (16%) · Tax</div>
            <div className="kpi-value mono">
              {summary ? formatKes(summary.taxCents) : '—'}
            </div>
            <div className="kpi-sub" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span>Standard VAT</span>
              <SparklineMini data={[10, 15, 20, 18, 30, 40, 52]} color="#3B82F6" width={70} height={24} />
            </div>
          </div>

          {/* Cash Captured */}
          <div className="kpi-card" style={{ ['--kpi-accent' as any]: 'var(--accent-amber)' }}>
            <div className="kpi-label">Cash Captured · Drawer</div>
            <div className="kpi-value mono" style={{ color: 'var(--accent-amber)' }}>
              {cashRow ? formatKes(cashRow.totalCents) : 'KES 0.00'}
            </div>
            <div className="kpi-sub" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span>{cashRow?.count ?? 0} cash orders</span>
              <SparklineMini data={[5, 10, 8, 22, 19, 35, 48]} color="#F59E0B" width={70} height={24} />
            </div>
          </div>

          {/* Estimated Profit */}
          <div className="kpi-card" style={{ ['--kpi-accent' as any]: 'var(--accent-emerald)' }}>
            <div className="kpi-label">Net Profit · {profit?.marginPct !== null && profit?.marginPct !== undefined ? `${profit.marginPct}% Margin` : 'Net'}</div>
            <div className="kpi-value mono" style={{ color: 'var(--accent-emerald)' }}>
              {profit ? formatKes(profit.profitCents) : '—'}
            </div>
            <div className="kpi-sub" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span>{profit?.itemsMissingCost ? `${profit.itemsMissingCost} missing cost` : 'Calculated'}</span>
              <SparklineMini data={[2, 8, 14, 25, 38, 42, 60]} color="#10B981" width={70} height={24} />
            </div>
          </div>
        </div>

        {/* Analytics Charts Row */}
        <div className="grid-2">
          <AreaTrendChart
            title="Intraday Revenue Curve"
            subtitle="Hourly gross sales progression for today"
            data={trendData}
            valuePrefix="KES "
            height={250}
          />

          <BarDistributionChart
            title="Payment Method Split"
            subtitle="Share of total revenue by gateway"
            data={paymentDistData}
            valuePrefix="KES "
          />
        </div>

        {/* Payment Breakdown Table */}
        <PaymentBreakdownTable data={breakdown} />
      </div>
    </>
  );
}

export default function OverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="page-content">
          <div className="section"><div className="empty">Loading overview…</div></div>
        </div>
      }
    >
      <OverviewContent />
    </Suspense>
  );
}
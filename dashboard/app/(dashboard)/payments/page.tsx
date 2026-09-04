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

interface Payment {
  id: string;
  transactionId: string;
  method: string;
  amountCents: number;
  mpesaReceiptNumber: string | null;
  mpesaPhoneNumber: string | null;
  checkoutRequestId: string | null;
  status: string;
}

export default async function PaymentsPage() {
  const today = nairobiToday();

  const [pending, breakdown] = await Promise.all([
    apiFetch<PendingMpesa[]>('/reports/pending-mpesa?thresholdMinutes=15').catch(() => []),
    apiFetch<{ method: string; status: string; totalCents: number; count: number }[]>(
      `/reports/payments-breakdown?date=${today}`,
    ).catch(() => []),
  ]);

  return (
    <>
      <div className="topbar">
        <h2>Payments &amp; M-Pesa Reconciliation</h2>
        <span className="topbar-badge"></span>
      </div>
      <div className="page-content">

        {/* ── Unconfirmed M-Pesa Alert ─────────────────────── */}
        {pending.length > 0 && (
          <div className="alert alert-warning" id="mpesa-alert">
            <strong>{pending.length}</strong> M-Pesa payment{pending.length !== 1 ? 's' : ''} unconfirmed
            for &gt;15 minutes. Review below.
          </div>
        )}

        {/* ── Flagged Unconfirmed Payments ─────────── */}
        <div className="section">
          <div className="section-header">
            <h3>Unconfirmed M-Pesa (&gt;15 min)</h3>
            <span className="topbar-badge" style={{ background: 'var(--accent-amber-bg)', color: 'var(--accent-amber)' }}>
              Blueprint
            </span>
          </div>
          <div className="table-wrap">
            {pending.length === 0 ? (
              <div className="empty">
                <p>No unconfirmed M-Pesa payments — all clear</p>
              </div>
            ) : (
              <table id="pending-mpesa-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Receipt / Code</th>
                    <th>Phone</th>
                    <th className="text-right">Amount</th>
                    <th>Age</th>
                    <th>Transaction ID</th>
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
                        <span className={`badge ${p.status === 'pending' ? 'badge-amber' : 'badge-amber'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="mono">{p.mpesaReceiptNumber ?? p.checkoutRequestId?.slice(0, 20) ?? '—'}</td>
                      <td className="mono">{p.mpesaPhoneNumber ?? '—'}</td>
                      <td className="text-right font-bold">{formatKes(p.amountCents)}</td>
                      <td>
                        <span className={`badge ${p.ageMinutes > 60 ? 'badge-red' : 'badge-amber'}`}>
                          {p.ageMinutes}m
                        </span>
                      </td>
                      <td className="mono td-muted">{p.transactionId.slice(0, 8)}…</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Today's Payment Breakdown ─────────────────────── */}
        <div className="section">
          <div className="section-header">
            <h3>Today&apos;s Payment Method Breakdown</h3>
            <span className="topbar-badge">{today}</span>
          </div>
          <div className="table-wrap">
            {breakdown.length === 0 ? (
              <div className="empty">
                <p>No payments recorded today</p>
              </div>
            ) : (
              <table id="payment-breakdown-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Status</th>
                    <th className="text-right">Count</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((row, i) => {
                    const methodMap: Record<string, string> = {
                      cash: 'Cash', mpesa_stk: 'M-Pesa STK Push', mpesa_till: 'M-Pesa Till Number',
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
                        <td><span className={classMap[row.method] ?? ''}>{methodMap[row.method] ?? row.method}</span></td>
                        <td><span className={`badge ${badgeMap[row.status] ?? 'badge-gray'}`}>{row.status}</span></td>
                        <td className="text-right">{row.count}</td>
                        <td className="text-right font-bold">{formatKes(row.totalCents)}</td>
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
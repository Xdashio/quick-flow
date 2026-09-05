import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Nairobi is UTC+3 — use this offset for day-boundary calculations */
const NAIROBI_OFFSET_MS = 3 * 60 * 60 * 1000;

function nairobiDayBounds(dateStr?: string): { from: Date; to: Date } {
  if (dateStr) {
    // Caller provided YYYY-MM-DD in Nairobi time
    const [y, m, d] = dateStr.split('-').map(Number);
    const from = new Date(Date.UTC(y, m - 1, d) - NAIROBI_OFFSET_MS);
    const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
    return { from, to };
  }
  // Default: today in Nairobi
  const nowNairobi = new Date(Date.now() + NAIROBI_OFFSET_MS);
  const from = new Date(
    Date.UTC(
      nowNairobi.getUTCFullYear(),
      nowNairobi.getUTCMonth(),
      nowNairobi.getUTCDate(),
    ) - NAIROBI_OFFSET_MS,
  );
  const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  return { from, to };
}

export interface SalesSummary {
  date: string;
  completedCount: number;
  grossCents: number;
  taxCents: number;
  voidedCents: number;
  refundedCents: number;
}

export interface PaymentBreakdownRow {
  method: string;
  status: string;
  totalCents: number;
  count: number;
}

export interface ProfitSummary {
  date: string;
  revenueCents: number;
  costCents: number;
  profitCents: number;
  marginPct: number | null;
  /** Line items sold with no costCents set on the product yet — profit for these is excluded from costCents/profitCents above. */
  itemsMissingCost: number;
}

export interface PendingMpesaRow {
  id: string;
  transactionId: string;
  method: string;
  status: string;
  amountCents: number;
  mpesaReceiptNumber: string | null;
  mpesaPhoneNumber: string | null;
  checkoutRequestId: string | null;
  createdAt: Date;
  ageMinutes: number;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sales summary for a single day.
   * Real SQL aggregation — no fixture data.
   * Returns completed count, gross sales, VAT collected, voided/refunded totals.
   */
  async getSalesSummary(date?: string): Promise<SalesSummary> {
    const { from, to } = nairobiDayBounds(date);

    const rows = (await this.prisma.$queryRawUnsafe<
      Array<{
        completed_count: bigint;
        gross_cents: bigint | null;
        tax_cents: bigint | null;
        voided_cents: bigint | null;
        refunded_cents: bigint | null;
      }>
    >(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'COMPLETED')                             AS completed_count,
        SUM(total_cents) FILTER (WHERE status = 'COMPLETED')                     AS gross_cents,
        SUM(tax_cents)   FILTER (WHERE status = 'COMPLETED')                     AS tax_cents,
        SUM(total_cents) FILTER (WHERE status = 'VOIDED')                        AS voided_cents,
        SUM(total_cents) FILTER (WHERE status = 'REFUNDED')                      AS refunded_cents
      FROM transactions
      WHERE created_at >= $1 AND created_at < $2`,
      from,
      to,
    )) as any[];

    const r = rows[0];
    return {
      date: from.toISOString().slice(0, 10),
      completedCount: Number(r.completed_count ?? 0),
      grossCents: Number(r.gross_cents ?? 0),
      taxCents: Number(r.tax_cents ?? 0),
      voidedCents: Number(r.voided_cents ?? 0),
      refundedCents: Number(r.refunded_cents ?? 0),
    };
  }

  /**
   * Profit summary for a single day: revenue (ex-tax) minus cost of goods
   * sold, for completed sales. Cost is the unitCostCents frozen on each
   * line item at sale time (so later edits to a product's cost don't
   * rewrite historical profit) — items sold before a cost was ever set on
   * the product are counted in revenue but excluded from cost/profit, and
   * flagged via itemsMissingCost so the number isn't silently wrong.
   */
  async getProfitSummary(date?: string): Promise<ProfitSummary> {
    const { from, to } = nairobiDayBounds(date);

    const rows = (await this.prisma.$queryRawUnsafe<
      Array<{
        revenue_cents: string | null;
        cost_cents: string | null;
        items_missing_cost: bigint;
      }>
    >(
      `SELECT
        ROUND(SUM(li.unit_price_cents * li.quantity - li.discount_cents))::bigint AS revenue_cents,
        ROUND(SUM(COALESCE(li.unit_cost_cents, 0) * li.quantity) FILTER (WHERE li.unit_cost_cents IS NOT NULL))::bigint AS cost_cents,
        COUNT(*) FILTER (WHERE li.unit_cost_cents IS NULL) AS items_missing_cost
      FROM transaction_line_items li
      JOIN transactions t ON t.id = li.transaction_id
      WHERE t.status = 'COMPLETED' AND t.created_at >= $1 AND t.created_at < $2`,
      from,
      to,
    )) as any[];

    const r = rows[0];
    const revenueCents = Number(r?.revenue_cents ?? 0);
    const costCents = Number(r?.cost_cents ?? 0);
    const profitCents = revenueCents - costCents;

    return {
      date: from.toISOString().slice(0, 10),
      revenueCents,
      costCents,
      profitCents,
      marginPct: revenueCents > 0 ? Math.round((profitCents / revenueCents) * 1000) / 10 : null,
      itemsMissingCost: Number(r?.items_missing_cost ?? 0),
    };
  }

  /**
   * Payment method breakdown for a day.
   * Shows cash vs mpesa_stk vs mpesa_till, and their statuses.
   */
  async getPaymentBreakdown(date?: string): Promise<PaymentBreakdownRow[]> {
    const { from, to } = nairobiDayBounds(date);

    // Join payments → transactions to filter by transaction date
    const rows = (await this.prisma.$queryRawUnsafe<
      Array<{
        method: string;
        status: string;
        total_cents: bigint;
        count: bigint;
      }>
    >(
      `SELECT
        p.method,
        p.status,
        SUM(p.amount_cents) AS total_cents,
        COUNT(*)            AS count
      FROM payments p
      JOIN transactions t ON t.id = p.transaction_id
      WHERE t.created_at >= $1 AND t.created_at < $2
      GROUP BY p.method, p.status
      ORDER BY p.method, p.status`,
      from,
      to,
    )) as any[];

    return rows.map((r) => ({
      method: r.method,
      status: r.status,
      totalCents: Number(r.total_cents ?? 0),
      count: Number(r.count ?? 0),
    }));
  }

  /**
   * M-Pesa payments that are still pending/awaiting_confirmation
   * older than the threshold (default 15 minutes), flagged per blueprint.
   */
  async getPendingMpesa(thresholdMinutes = 15): Promise<PendingMpesaRow[]> {
    const rows = (await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT
        p.id,
        p.transaction_id,
        p.method,
        p.status,
        p.amount_cents,
        p.mpesa_receipt_number,
        p.mpesa_phone_number,
        p.checkout_request_id,
        p.created_at,
        EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 60 AS age_minutes
      FROM payments p
      WHERE p.method IN ('mpesa_stk', 'mpesa_till')
        AND p.status IN ('pending', 'awaiting_confirmation')
        AND p.created_at < NOW() - ($1 || ' minutes')::INTERVAL
      ORDER BY p.created_at ASC`,
      String(thresholdMinutes),
    )) as any[];

    return rows.map((r) => ({
      id: r.id,
      transactionId: r.transaction_id,
      method: r.method,
      status: r.status,
      amountCents: Number(r.amount_cents),
      mpesaReceiptNumber: r.mpesa_receipt_number ?? null,
      mpesaPhoneNumber: r.mpesa_phone_number ?? null,
      checkoutRequestId: r.checkout_request_id ?? null,
      createdAt: r.created_at,
      ageMinutes: Math.round(Number(r.age_minutes ?? 0)),
    }));
  }

  /**
   * Drawer reconciliation: drawer open events grouped by reason,
   * compared to captured cash payment count for the same day.
   */
  async getDrawerSummary(date?: string) {
    const { from, to } = nairobiDayBounds(date);

    const [drawerRows, cashRows] = await Promise.all([
      this.prisma.$queryRawUnsafe<any[]>(
        `SELECT reason, COUNT(*) AS count, SUM(COALESCE(amount_cents,0)) AS total_cents
         FROM drawer_events
         WHERE created_at >= $1 AND created_at < $2
         GROUP BY reason ORDER BY reason`,
        from,
        to,
      ),
      this.prisma.$queryRawUnsafe<any[]>(
        `SELECT COUNT(*) AS count, SUM(amount_cents) AS total_cents
         FROM payments p
         JOIN transactions t ON t.id = p.transaction_id
         WHERE p.method = 'cash' AND p.status = 'captured'
           AND t.created_at >= $1 AND t.created_at < $2`,
        from,
        to,
      ),
    ]);

    return {
      drawerEvents: drawerRows.map((r) => ({
        reason: r.reason,
        count: Number(r.count),
        totalCents: Number(r.total_cents ?? 0),
      })),
      cashCaptured: {
        count: Number((cashRows[0] as any)?.count ?? 0),
        totalCents: Number((cashRows[0] as any)?.total_cents ?? 0),
      },
    };
  }
}

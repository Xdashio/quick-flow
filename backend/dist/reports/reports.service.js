"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const NAIROBI_OFFSET_MS = 3 * 60 * 60 * 1000;
function nairobiDayBounds(dateStr) {
    if (dateStr) {
        const [y, m, d] = dateStr.split('-').map(Number);
        const from = new Date(Date.UTC(y, m - 1, d) - NAIROBI_OFFSET_MS);
        const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
        return { from, to };
    }
    const nowNairobi = new Date(Date.now() + NAIROBI_OFFSET_MS);
    const from = new Date(Date.UTC(nowNairobi.getUTCFullYear(), nowNairobi.getUTCMonth(), nowNairobi.getUTCDate()) - NAIROBI_OFFSET_MS);
    const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
    return { from, to };
}
let ReportsService = class ReportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSalesSummary(date) {
        const { from, to } = nairobiDayBounds(date);
        const rows = (await this.prisma.$queryRawUnsafe(`SELECT
        COUNT(*) FILTER (WHERE status = 'COMPLETED')                             AS completed_count,
        SUM(total_cents) FILTER (WHERE status = 'COMPLETED')                     AS gross_cents,
        SUM(tax_cents)   FILTER (WHERE status = 'COMPLETED')                     AS tax_cents,
        SUM(total_cents) FILTER (WHERE status = 'VOIDED')                        AS voided_cents,
        SUM(total_cents) FILTER (WHERE status = 'REFUNDED')                      AS refunded_cents
      FROM transactions
      WHERE created_at >= $1 AND created_at < $2`, from, to));
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
    async getProfitSummary(date) {
        const { from, to } = nairobiDayBounds(date);
        const rows = (await this.prisma.$queryRawUnsafe(`SELECT
        ROUND(SUM(li.unit_price_cents * li.quantity - li.discount_cents))::bigint AS revenue_cents,
        ROUND(SUM(COALESCE(li.unit_cost_cents, 0) * li.quantity) FILTER (WHERE li.unit_cost_cents IS NOT NULL))::bigint AS cost_cents,
        COUNT(*) FILTER (WHERE li.unit_cost_cents IS NULL) AS items_missing_cost
      FROM transaction_line_items li
      JOIN transactions t ON t.id = li.transaction_id
      WHERE t.status = 'COMPLETED' AND t.created_at >= $1 AND t.created_at < $2`, from, to));
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
    async getPaymentBreakdown(date) {
        const { from, to } = nairobiDayBounds(date);
        const rows = (await this.prisma.$queryRawUnsafe(`SELECT
        p.method,
        p.status,
        SUM(p.amount_cents) AS total_cents,
        COUNT(*)            AS count
      FROM payments p
      JOIN transactions t ON t.id = p.transaction_id
      WHERE t.created_at >= $1 AND t.created_at < $2
      GROUP BY p.method, p.status
      ORDER BY p.method, p.status`, from, to));
        return rows.map((r) => ({
            method: r.method,
            status: r.status,
            totalCents: Number(r.total_cents ?? 0),
            count: Number(r.count ?? 0),
        }));
    }
    async getPendingMpesa(thresholdMinutes = 15) {
        const rows = (await this.prisma.$queryRawUnsafe(`SELECT
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
      ORDER BY p.created_at ASC`, String(thresholdMinutes)));
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
    async getDrawerSummary(date) {
        const { from, to } = nairobiDayBounds(date);
        const [drawerRows, cashRows] = await Promise.all([
            this.prisma.$queryRawUnsafe(`SELECT reason, COUNT(*) AS count, SUM(COALESCE(amount_cents,0)) AS total_cents
         FROM drawer_events
         WHERE created_at >= $1 AND created_at < $2
         GROUP BY reason ORDER BY reason`, from, to),
            this.prisma.$queryRawUnsafe(`SELECT COUNT(*) AS count, SUM(amount_cents) AS total_cents
         FROM payments p
         JOIN transactions t ON t.id = p.transaction_id
         WHERE p.method = 'cash' AND p.status = 'captured'
           AND t.created_at >= $1 AND t.created_at < $2`, from, to),
        ]);
        return {
            drawerEvents: drawerRows.map((r) => ({
                reason: r.reason,
                count: Number(r.count),
                totalCents: Number(r.total_cents ?? 0),
            })),
            cashCaptured: {
                count: Number(cashRows[0]?.count ?? 0),
                totalCents: Number(cashRows[0]?.total_cents ?? 0),
            },
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map
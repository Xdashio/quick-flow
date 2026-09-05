import { PrismaService } from '../prisma/prisma.service';
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
export declare class ReportsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getSalesSummary(date?: string): Promise<SalesSummary>;
    getProfitSummary(date?: string): Promise<ProfitSummary>;
    getPaymentBreakdown(date?: string): Promise<PaymentBreakdownRow[]>;
    getPendingMpesa(thresholdMinutes?: number): Promise<PendingMpesaRow[]>;
    getDrawerSummary(date?: string): Promise<{
        drawerEvents: {
            reason: any;
            count: number;
            totalCents: number;
        }[];
        cashCaptured: {
            count: number;
            totalCents: number;
        };
    }>;
}

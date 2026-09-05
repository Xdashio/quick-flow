import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly service;
    constructor(service: ReportsService);
    summary(date?: string): Promise<import("./reports.service").SalesSummary>;
    profit(date?: string): Promise<import("./reports.service").ProfitSummary>;
    paymentsBreakdown(date?: string): Promise<import("./reports.service").PaymentBreakdownRow[]>;
    pendingMpesa(thresholdMinutes?: string): Promise<import("./reports.service").PendingMpesaRow[]>;
    drawer(date?: string): Promise<{
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

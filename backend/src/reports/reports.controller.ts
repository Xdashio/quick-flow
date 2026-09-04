import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  /**
   * GET /api/reports/summary?date=YYYY-MM-DD
   * Real aggregation of transactions for a Nairobi calendar day.
   * Omitting date defaults to today (Nairobi time).
   */
  @Get('summary')
  summary(@Query('date') date?: string) {
    return this.service.getSalesSummary(date);
  }

  /**
   * GET /api/reports/payments-breakdown?date=YYYY-MM-DD
   * Payment method + status breakdown: cash / mpesa_stk / mpesa_till.
   */
  @Get('payments-breakdown')
  paymentsBreakdown(@Query('date') date?: string) {
    return this.service.getPaymentBreakdown(date);
  }

  /**
   * GET /api/reports/pending-mpesa?thresholdMinutes=15
   * Unconfirmed M-Pesa payments older than threshold — blueprint flag.
   */
  @Get('pending-mpesa')
  pendingMpesa(@Query('thresholdMinutes') thresholdMinutes?: string) {
    return this.service.getPendingMpesa(
      thresholdMinutes ? parseInt(thresholdMinutes, 10) : 15,
    );
  }

  /**
   * GET /api/reports/drawer?date=YYYY-MM-DD
   * Drawer events by reason vs cash payments captured — end-of-day reconciliation.
   */
  @Get('drawer')
  drawer(@Query('date') date?: string) {
    return this.service.getDrawerSummary(date);
  }
}

import { Controller, Post, Body } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CashSaleDto } from './dto/cash-sale.dto';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly service: CheckoutService) {}

  // Primary offline-capable cash payment — creates payment record method=cash, COMPLETED, drawer, receipt
  @Post('cash')
  cashSale(@Body() dto: CashSaleDto) {
    return this.service.cashSale(dto);
  }

  // Non-sale drawer opens (no_sale, manager_override, change-making) with distinct reason codes
  @Post('drawer/open')
  openDrawer(@Body() dto: { registerId?: string; userId?: string; reason: string; amountCents?: number }) {
    return this.service.logDrawerEvent(dto);
  }
}

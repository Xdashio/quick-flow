import { Controller, Post, Body, Param } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CashSaleDto } from './dto/cash-sale.dto';
import { MpesaStkSaleDto } from './dto/mpesa-stk-sale.dto';
import { MpesaTillSaleDto } from './dto/mpesa-till-sale.dto';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly service: CheckoutService) {}

  // Primary cash payment - creates payment record method=cash, COMPLETED, drawer, receipt
  @Post('cash')
  cashSale(@Body() dto: CashSaleDto) {
    return this.service.cashSale(dto);
  }

  // M-Pesa STK Push sale - creates transaction AWAITING_PAYMENT and triggers prompt
  @Post('mpesa-stk')
  mpesaStkSale(@Body() dto: MpesaStkSaleDto) {
    return this.service.mpesaStkSale(dto);
  }

  // M-Pesa Buy Goods Till manual sale - creates transaction COMPLETED, captured payment, receipt
  @Post('mpesa-till')
  mpesaTillSale(@Body() dto: MpesaTillSaleDto) {
    return this.service.mpesaTillSale(dto);
  }

  // Generate receipt / finalize for STK payment once captured
  @Post('mpesa-complete/:paymentId')
  completeMpesaSale(@Param('paymentId') paymentId: string) {
    return this.service.completeMpesaSale(paymentId);
  }

  // Non-sale drawer opens (no_sale, manager_override, change-making) with distinct reason codes
  @Post('drawer/open')
  openDrawer(@Body() dto: { registerId?: string; userId?: string; reason: string; amountCents?: number }) {
    return this.service.logDrawerEvent(dto);
  }
}

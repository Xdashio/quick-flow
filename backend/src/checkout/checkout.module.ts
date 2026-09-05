import { Module } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { HardwareModule } from '../hardware/hardware.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [HardwareModule, PaymentsModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { MpesaService } from './mpesa.service';

@Module({
  imports: [
    HttpModule.register({
      // Default timeout for all Daraja HTTP calls
      timeout: 15_000,
      maxRedirects: 3,
    }),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, MpesaService],
  exports: [PaymentsService, MpesaService],
})
export class PaymentsModule {}

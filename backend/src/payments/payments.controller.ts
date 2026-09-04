import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { MpesaService } from './mpesa.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { StkPushDto } from './dto/stk-push.dto';
import { TillPaymentDto } from './dto/till-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly service: PaymentsService,
    private readonly mpesa: MpesaService,
  ) {}

  // ─── Generic payment CRUD ──────────────────────────────────────────────

  @Post()
  create(@Body() dto: CreatePaymentDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('transactionId') transactionId?: string) {
    return this.service.findAll(transactionId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  // ─── M-Pesa STK Push ───────────────────────────────────────────────────

  /**
   * POST /payments/mpesa/stk-push
   * Initiates a real Daraja STK Push prompt to the customer's phone.
   * Creates a pending Payment record with checkoutRequestId before returning.
   *
   * Body: { transactionId, phoneNumber, amountCents }
   * Sandbox test MSISDN: 254708374149
   */
  @Post('mpesa/stk-push')
  async stkPush(@Body() dto: StkPushDto) {
    return this.mpesa.initiateSTKPush(
      dto.transactionId,
      dto.phoneNumber,
      dto.amountCents,
    );
  }

  // ─── Daraja Callback (no auth — Safaricom posts here) ─────────────────

  /**
   * POST /payments/mpesa/callback
   * Safaricom's Daraja sandbox posts the STK Push result to this endpoint.
   * Validates CheckoutRequestID against a pending DB record (§6.1) before
   * trusting the payload — returns 404 for unknown/mismatched callbacks.
   *
   * This endpoint must be publicly reachable (use ngrok/cloudflare tunnel in dev).
   */
  @Post('mpesa/callback')
  @HttpCode(HttpStatus.OK)
  async mpesaCallback(@Body() body: Record<string, any>) {
    return this.mpesa.handleCallback(body);
  }

  // ─── Till Number Manual Entry ──────────────────────────────────────────

  /**
   * POST /payments/mpesa/till
   * Cashier enters the M-Pesa transaction code shown on the merchant's
   * till receipt. Creates a payment with status='awaiting_confirmation'.
   *
   * Body: { transactionId, mpesaCode, amountCents }
   */
  @Post('mpesa/till')
  async tillPayment(@Body() dto: TillPaymentDto) {
    return this.mpesa.createTillPayment(
      dto.transactionId,
      dto.mpesaCode,
      dto.amountCents,
    );
  }

  // ─── Reconciliation ────────────────────────────────────────────────────

  /**
   * POST /payments/mpesa/reconcile/:paymentId
   * For STK payments: queries Daraja's transaction status API.
   * For Till payments: returns guidance on manual reconciliation.
   * Updates the payment record to 'captured' or 'failed'.
   */
  @Post('mpesa/reconcile/:paymentId')
  async reconcile(@Param('paymentId', ParseUUIDPipe) paymentId: string) {
    return this.mpesa.reconcileTillPayment(paymentId);
  }
}

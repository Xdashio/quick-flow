import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

// ─── Daraja response shapes (exported for controller return type inference) ──

export interface DarajaTokenResponse {
  access_token: string;
  expires_in: string;
}

export interface DarajaStkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;       // '0' = accepted
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface DarajaStkCallbackItem {
  Name: string;
  Value?: string | number;
}

export interface DarajaStkCallback {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: number;          // 0 = success, non-zero = failure
  ResultDesc: string;
  CallbackMetadata?: {
    Item: DarajaStkCallbackItem[];
  };
}

export interface DarajaStkQueryResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
}

@Injectable()
export class MpesaService {
  private readonly logger = new Logger(MpesaService.name);

  // Daraja sandbox base URL (switch to live URL in production)
  private readonly baseUrl = 'https://sandbox.safaricom.co.ke';

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── 1. OAuth Token ──────────────────────────────────────────────────────

  /**
   * Obtains a short-lived Daraja access token via Basic auth.
   * Throws ServiceUnavailableException if credentials are not configured —
   * never returns a fake/fabricated token.
   */
  async getAccessToken(): Promise<string> {
    const key = this.config.get<string>('DARAJA_CONSUMER_KEY');
    const secret = this.config.get<string>('DARAJA_CONSUMER_SECRET');

    if (!key || !secret) {
      throw new ServiceUnavailableException(
        'Daraja credentials not configured. ' +
          'Set DARAJA_CONSUMER_KEY and DARAJA_CONSUMER_SECRET in .env.',
      );
    }

    const credentials = Buffer.from(`${key}:${secret}`).toString('base64');
    const url = `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`;

    this.logger.log(`[Daraja] POST ${url}`);

    const response = await firstValueFrom(
      this.http.get<DarajaTokenResponse>(url, {
        headers: { Authorization: `Basic ${credentials}` },
        timeout: 10_000,
      }),
    );

    this.logger.log(
      `[Daraja] Token response: ${JSON.stringify(response.data)}`,
    );

    return response.data.access_token;
  }

  // ─── 2. STK Push ─────────────────────────────────────────────────────────

  /**
   * Initiates an STK Push to the customer's phone.
   * - Creates a Payment record with status='pending' and checkoutRequestId
   * - Returns the full raw Daraja response + internal payment record
   *
   * Per blueprint: CheckoutRequestID is persisted before Daraja responds
   * so the callback handler can validate it against a known pending record.
   */
  async initiateSTKPush(
    transactionId: string,
    phoneNumber: string,
    amountCents: number,
  ) {
    // Validate transaction exists
    const tx = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!tx) throw new NotFoundException(`Transaction ${transactionId} not found`);

    const accessToken = await this.getAccessToken();

    const shortcode = this.config.get<string>('DARAJA_SHORTCODE')!;
    const passkey = this.config.get<string>('DARAJA_PASSKEY')!;
    const callbackUrl = this.config.get<string>('DARAJA_CALLBACK_URL')!;

    // Timestamp: YYYYMMDDHHmmss (Nairobi time → UTC+3)
    const now = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }),
    );
    const timestamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0'),
    ].join('');

    // STK Push password = base64(shortcode + passkey + timestamp)
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString(
      'base64',
    );

    // Amount in whole KES (Daraja does not accept cents)
    const amountKes = Math.ceil(amountCents / 100);

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amountKes,
      PartyA: phoneNumber,          // customer phone
      PartyB: shortcode,            // receiving shortcode
      PhoneNumber: phoneNumber,
      CallBackURL: callbackUrl,
      AccountReference: transactionId.slice(0, 12), // max 12 chars
      TransactionDesc: `POS payment ${transactionId.slice(0, 8)}`,
    };

    const url = `${this.baseUrl}/mpesa/stkpush/v1/processrequest`;
    this.logger.log(`[Daraja] POST ${url} payload=${JSON.stringify(payload)}`);

    const response = await firstValueFrom(
      this.http.post<DarajaStkPushResponse>(url, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15_000,
      }),
    );

    this.logger.log(
      `[Daraja] STK Push raw response: ${JSON.stringify(response.data)}`,
    );

    if (response.data.ResponseCode !== '0') {
      throw new BadRequestException(
        `Daraja STK Push rejected: ${response.data.ResponseDescription}`,
      );
    }

    // Persist pending payment with CheckoutRequestID BEFORE callback arrives
    const payment = await this.prisma.payment.create({
      data: {
        transactionId,
        method: 'mpesa_stk',
        amountCents,
        mpesaPhoneNumber: phoneNumber,
        checkoutRequestId: response.data.CheckoutRequestID,
        status: 'pending',
      },
    });

    return {
      darajaResponse: response.data,
      payment,
    };
  }

  // ─── 3. Callback Handler ─────────────────────────────────────────────────

  /**
   * Handles the real Daraja STK Push callback.
   *
   * Security validation per blueprint:
   * - Cross-checks CheckoutRequestID against a known `pending` Payment in DB
   * - Rejects with 404 if no matching record exists (not trusting payload blindly)
   *
   * On ResultCode=0 (success): marks payment `captured`, writes receipt number
   * On ResultCode≠0 (failure): marks payment `failed`, logs reason
   */
  async handleCallback(body: Record<string, any>): Promise<{ acknowledged: boolean }> {
    const callback: DarajaStkCallback = body?.Body?.stkCallback;

    if (!callback || !callback.CheckoutRequestID) {
      this.logger.warn('[Daraja] Callback received with missing stkCallback structure');
      throw new BadRequestException('Invalid callback payload: missing stkCallback');
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;

    this.logger.log(
      `[Daraja] Callback received: CheckoutRequestID=${CheckoutRequestID} ` +
        `ResultCode=${ResultCode} ResultDesc=${ResultDesc}`,
    );

    // ── Validate CheckoutRequestID against a PENDING payment ──────
    const payment = await this.prisma.payment.findFirst({
      where: {
        checkoutRequestId: CheckoutRequestID,
        status: 'pending',
      },
    });

    if (!payment) {
      this.logger.warn(
        `[Daraja] REJECTED callback — no pending payment found for CheckoutRequestID=${CheckoutRequestID}`,
      );
      // Return 404 to Daraja; it will retry but we refuse to process unknown callbacks
      throw new NotFoundException(
        `No pending payment found for CheckoutRequestID: ${CheckoutRequestID}`,
      );
    }

    if (ResultCode === 0) {
      // ── Successful payment — extract receipt details from CallbackMetadata ──
      const items = CallbackMetadata?.Item ?? [];
      const get = (name: string) =>
        items.find((i) => i.Name === name)?.Value ?? null;

      const mpesaReceiptNumber = get('MpesaReceiptNumber') as string | null;
      const mpesaPhone = get('PhoneNumber') as string | null;

      this.logger.log(
        `[Daraja] Payment CAPTURED: receipt=${mpesaReceiptNumber} phone=${mpesaPhone}`,
      );

      const updated = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'captured',
          mpesaReceiptNumber: mpesaReceiptNumber,
          mpesaPhoneNumber: mpesaPhone ?? payment.mpesaPhoneNumber,
        },
      });

      this.logger.log(`[Daraja] Payment ${payment.id} updated to captured`);
      return { acknowledged: true };

    } else {
      // ── Failed/cancelled payment ──────────────────────────────────────
      this.logger.warn(
        `[Daraja] Payment FAILED: CheckoutRequestID=${CheckoutRequestID} reason="${ResultDesc}"`,
      );

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      });

      return { acknowledged: true };
    }
  }

  // ─── 4. Till Number Manual Entry ─────────────────────────────────────────

  /**
   * Cashier manually enters an M-Pesa transaction code after customer pays
   * via the merchant's till number. Creates a payment record with
   * status='awaiting_confirmation' pending reconciliation.
   */
  async createTillPayment(
    transactionId: string,
    mpesaCode: string,
    amountCents: number,
  ) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!tx) throw new NotFoundException(`Transaction ${transactionId} not found`);

    // Prevent duplicate submission of the same M-Pesa code
    const existing = await this.prisma.payment.findFirst({
      where: { mpesaReceiptNumber: mpesaCode },
    });
    if (existing) {
      throw new BadRequestException(
        `M-Pesa code ${mpesaCode} has already been recorded (payment ${existing.id})`,
      );
    }

    const payment = await this.prisma.payment.create({
      data: {
        transactionId,
        method: 'mpesa_till',
        amountCents,
        mpesaReceiptNumber: mpesaCode,
        status: 'awaiting_confirmation',
      },
    });

    this.logger.log(
      `[MpesaTill] Created awaiting_confirmation payment ${payment.id} ` +
        `for code ${mpesaCode} on transaction ${transactionId}`,
    );

    return payment;
  }

  // ─── 5. Reconciliation ───────────────────────────────────────────────────

  /**
   * Reconciliation job: for STK payments with a checkoutRequestId, queries
   * Daraja's transaction status API to confirm/update the record.
   * Till payments (mpesa_till) have no checkoutRequestId and require
   * manual business reconciliation — this is logged clearly.
   */
  async reconcileTillPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) throw new NotFoundException(`Payment ${paymentId} not found`);

    if (payment.status !== 'awaiting_confirmation' && payment.status !== 'pending') {
      return {
        message: `Payment ${paymentId} is already in terminal status: ${payment.status}`,
        payment,
      };
    }

    // Till payments: no checkoutRequestId — cannot query Daraja API
    // They require manual reconciliation against merchant's M-Pesa statement
    if (payment.method === 'mpesa_till' || !payment.checkoutRequestId) {
      this.logger.log(
        `[Reconcile] Payment ${paymentId} is a till payment — ` +
          'requires manual reconciliation against M-Pesa merchant statement',
      );
      return {
        message:
          'Till payment awaiting_confirmation. Manual reconciliation required: ' +
          'verify transaction code against your M-Pesa merchant statement or use ' +
          "Safaricom's Reverse/Confirm API with your till number credentials.",
        payment,
        requiresManualReconciliation: true,
      };
    }

    // STK payment with checkoutRequestId — query Daraja
    const accessToken = await this.getAccessToken();
    const shortcode = this.config.get<string>('DARAJA_SHORTCODE')!;
    const passkey = this.config.get<string>('DARAJA_PASSKEY')!;

    const now = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }),
    );
    const timestamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0'),
    ].join('');
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    const queryPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: payment.checkoutRequestId,
    };

    const url = `${this.baseUrl}/mpesa/stkpushquery/v1/query`;
    this.logger.log(`[Daraja] POST ${url} payload=${JSON.stringify(queryPayload)}`);

    const response = await firstValueFrom(
      this.http.post<DarajaStkQueryResponse>(url, queryPayload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10_000,
      }),
    );

    this.logger.log(
      `[Daraja] Query response: ${JSON.stringify(response.data)}`,
    );

    const resultCode = String(response.data.ResultCode);

    if (resultCode === '0') {
      const updated = await this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'captured' },
      });
      return { message: 'Reconciled: payment captured', payment: updated, darajaResponse: response.data };
    } else {
      const updated = await this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'failed' },
      });
      return {
        message: `Reconciled: payment failed — ${response.data.ResultDesc}`,
        payment: updated,
        darajaResponse: response.data,
      };
    }
  }
}

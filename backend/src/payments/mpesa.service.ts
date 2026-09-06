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

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  private getBaseUrl(): string {
    const env = (this.config.get<string>('DARAJA_ENV') || 'sandbox').toLowerCase();
    return env === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  normalizePhoneNumber(raw: string): string {
    let phone = raw.trim().replace(/\D/g, '');
    if (phone.startsWith('0')) {
      phone = '254' + phone.substring(1);
    } else if (phone.startsWith('7') || phone.startsWith('1')) {
      phone = '254' + phone;
    }
    return phone;
  }

  // ─── 1. OAuth Token ──────────────────────────────────────────────────────

  /**
   * Obtains a short-lived Daraja access token via Basic auth.
   * Throws ServiceUnavailableException if credentials are not configured.
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
    const url = `${this.getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`;

    this.logger.log(`[Daraja] Requesting access token from ${url}`);

    const response = await firstValueFrom(
      this.http.get<DarajaTokenResponse>(url, {
        headers: { Authorization: `Basic ${credentials}` },
        timeout: 10_000,
      }),
    );

    this.logger.log(`[Daraja] Access token generated successfully`);

    return response.data.access_token;
  }

  // ─── 2. STK Push ─────────────────────────────────────────────────────────

  /**
   * Initiates an STK Push to the customer's phone.
   * - Creates a Payment record with status='pending' and checkoutRequestId
   * - Returns the full raw Daraja response + internal payment record
   */
  async initiateSTKPush(
    transactionId: string,
    phoneNumber: string,
    amountCents: number,
  ) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!tx) throw new NotFoundException(`Transaction ${transactionId} not found`);

    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    const accessToken = await this.getAccessToken();

    const shortcode = this.config.get<string>('DARAJA_SHORTCODE');
    const passkey = this.config.get<string>('DARAJA_PASSKEY');
    const callbackUrl = this.config.get<string>('DARAJA_CALLBACK_URL');
    const transactionType =
      this.config.get<string>('DARAJA_TRANSACTION_TYPE') || 'CustomerBuyGoodsOnline';

    if (!shortcode || !passkey || !callbackUrl) {
      throw new ServiceUnavailableException(
        'Daraja shortcode, passkey or callback URL not configured in .env',
      );
    }

    // Timestamp: YYYYMMDDHHmmss (Nairobi time -> UTC+3)
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

    // For CustomerBuyGoodsOnline, Safaricom usually expects the Till Number for BusinessShortCode, PartyB, and Password generation
    const tillNumber = this.config.get<string>('TILL_NUMBER');
    const b2cShortcode = transactionType === 'CustomerBuyGoodsOnline' && tillNumber ? tillNumber : shortcode;

    // STK Push password = base64(BusinessShortCode + passkey + timestamp)
    const password = Buffer.from(`${b2cShortcode}${passkey}${timestamp}`).toString('base64');

    // Amount in whole KES (Daraja does not accept cents)
    const amountKes = Math.max(1, Math.ceil(amountCents / 100));

    const payload = {
      BusinessShortCode: b2cShortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: transactionType,
      Amount: amountKes,
      PartyA: normalizedPhone,
      PartyB: b2cShortcode,
      PhoneNumber: normalizedPhone,
      CallBackURL: callbackUrl,
      AccountReference: transactionId.slice(0, 12),
      TransactionDesc: `POS payment ${transactionId.slice(0, 8)}`,
    };

    const url = `${this.getBaseUrl()}/mpesa/stkpush/v1/processrequest`;
    this.logger.log(`[Daraja] POST ${url} with shortcode ${shortcode} to ${normalizedPhone}`);

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
      `[Daraja] STK Push response: Code=${response.data.ResponseCode}, CheckoutRequestID=${response.data.CheckoutRequestID}`,
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
        mpesaPhoneNumber: normalizedPhone,
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
   * Handles the Daraja STK Push callback.
   * On ResultCode=0 (success): marks payment captured and finalizes transaction
   * On ResultCode!=0 (failure): marks payment failed
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

    const payment = await this.prisma.payment.findFirst({
      where: {
        checkoutRequestId: CheckoutRequestID,
        status: 'pending',
      },
    });

    if (!payment) {
      this.logger.warn(
        `[Daraja] REJECTED callback - no pending payment found for CheckoutRequestID=${CheckoutRequestID}`,
      );
      throw new NotFoundException(
        `No pending payment found for CheckoutRequestID: ${CheckoutRequestID}`,
      );
    }

    if (ResultCode === 0) {
      const items = CallbackMetadata?.Item ?? [];
      const get = (name: string) =>
        items.find((i) => i.Name === name)?.Value ?? null;

      const mpesaReceiptNumber = get('MpesaReceiptNumber') as string | null;
      const mpesaPhone = get('PhoneNumber') as string | null;

      this.logger.log(
        `[Daraja] Payment CAPTURED: receipt=${mpesaReceiptNumber} phone=${mpesaPhone}`,
      );

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'captured',
          mpesaReceiptNumber: mpesaReceiptNumber,
          mpesaPhoneNumber: mpesaPhone ? String(mpesaPhone) : payment.mpesaPhoneNumber,
        },
      });

      await this.finalizeTransaction(payment.transactionId);

      this.logger.log(`[Daraja] Payment ${payment.id} and transaction ${payment.transactionId} completed`);
      return { acknowledged: true };
    } else {
      this.logger.warn(
        `[Daraja] Payment FAILED: CheckoutRequestID=${CheckoutRequestID} reason="${ResultDesc}"`,
      );

      // DEBUG: Write the exact Safaricom error to a file so we can read it easily
      try {
        const fs = require('fs');
        const path = require('path');
        fs.writeFileSync(
          path.join(process.cwd(), 'public', 'daraja-error.txt'),
          `[${new Date().toISOString()}] FAILED CheckoutRequestID=${CheckoutRequestID}\nReason: ${ResultDesc}\nResultCode: ${ResultCode}\n\n`
        );
      } catch (e) {}

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
   * via the merchant's till number (e.g. Till 3636288).
   * Creates captured payment record and completes the transaction.
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

    const formattedCode = mpesaCode.trim().toUpperCase();

    // Prevent duplicate submission of the same M-Pesa code
    const existing = await this.prisma.payment.findFirst({
      where: { mpesaReceiptNumber: formattedCode },
    });
    if (existing) {
      throw new BadRequestException(
        `M-Pesa code ${formattedCode} has already been recorded (payment ${existing.id})`,
      );
    }

    const payment = await this.prisma.payment.create({
      data: {
        transactionId,
        method: 'mpesa_till',
        amountCents,
        mpesaReceiptNumber: formattedCode,
        status: 'captured',
      },
    });

    await this.finalizeTransaction(transactionId);

    this.logger.log(
      `[MpesaTill] Created captured payment ${payment.id} for code ${formattedCode} on transaction ${transactionId}`,
    );

    return payment;
  }

  // ─── 5. Status & Reconciliation ──────────────────────────────────────────

  async getPaymentStatus(id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        OR: [
          { id },
          { checkoutRequestId: id },
        ],
      },
      include: {
        transaction: {
          include: {
            lineItems: { include: { product: true } },
          },
        },
      },
    });

    if (!payment) throw new NotFoundException(`Payment ${id} not found`);
    return payment;
  }

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

    if (payment.method === 'mpesa_till' || !payment.checkoutRequestId) {
      return {
        message:
          'Till payment manual reconciliation: verify transaction code against M-Pesa statement.',
        payment,
        requiresManualReconciliation: true,
      };
    }

    // STK payment with checkoutRequestId - query Daraja
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

    const url = `${this.getBaseUrl()}/mpesa/stkpushquery/v1/query`;
    this.logger.log(`[Daraja] Querying STK status for ${payment.checkoutRequestId}`);

    const response = await firstValueFrom(
      this.http.post<DarajaStkQueryResponse>(url, queryPayload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10_000,
      }),
    );

    const resultCode = String(response.data.ResultCode);

    if (resultCode === '0') {
      const updated = await this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'captured' },
      });
      await this.finalizeTransaction(payment.transactionId);
      return { message: 'Reconciled: payment captured', payment: updated, darajaResponse: response.data };
    } else {
      const updated = await this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'failed' },
      });
      return {
        message: `Reconciled: payment failed - ${response.data.ResultDesc}`,
        payment: updated,
        darajaResponse: response.data,
      };
    }
  }

  /**
   * Finalizes a transaction once payment is captured:
   * - Marks transaction as COMPLETED
   * - Creates inventory movements (deducts stock)
   * - Refreshes current_inventory materialized view
   */
  private async finalizeTransaction(transactionId: string) {
    try {
      const tx = await this.prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { lineItems: true },
      });

      if (!tx || tx.status === 'COMPLETED') return;

      // Update status to COMPLETED
      await this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'COMPLETED',
          syncedAt: new Date(),
        },
      });

      // Record inventory deduction movements if not already recorded
      const existingMovement = await this.prisma.inventoryMovement.findFirst({
        where: { referenceId: transactionId },
      });

      if (!existingMovement && tx.lineItems.length > 0) {
        for (const li of tx.lineItems) {
          await this.prisma.inventoryMovement.create({
            data: {
              productId: li.productId,
              locationId: tx.locationId,
              quantityDelta: -Number(li.quantity),
              reason: 'sale',
              referenceId: tx.id,
              createdBy: tx.cashierId ?? null,
            },
          });
        }
      }

      // Refresh materialized view if available
      try {
        await this.prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW CONCURRENTLY current_inventory');
      } catch {
        try {
          await this.prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW current_inventory');
        } catch {}
      }
    } catch (err: any) {
      this.logger.error(`Failed to finalize transaction ${transactionId}: ${err.message}`);
    }
  }
}

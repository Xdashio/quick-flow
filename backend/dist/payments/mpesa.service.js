"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MpesaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MpesaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const prisma_service_1 = require("../prisma/prisma.service");
let MpesaService = MpesaService_1 = class MpesaService {
    config;
    http;
    prisma;
    logger = new common_1.Logger(MpesaService_1.name);
    constructor(config, http, prisma) {
        this.config = config;
        this.http = http;
        this.prisma = prisma;
    }
    getBaseUrl() {
        const env = (this.config.get('DARAJA_ENV') || 'sandbox').toLowerCase();
        return env === 'production'
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';
    }
    normalizePhoneNumber(raw) {
        let phone = raw.trim().replace(/\D/g, '');
        if (phone.startsWith('0')) {
            phone = '254' + phone.substring(1);
        }
        else if (phone.startsWith('7') || phone.startsWith('1')) {
            phone = '254' + phone;
        }
        return phone;
    }
    async getAccessToken() {
        const key = this.config.get('DARAJA_CONSUMER_KEY');
        const secret = this.config.get('DARAJA_CONSUMER_SECRET');
        if (!key || !secret) {
            throw new common_1.ServiceUnavailableException('Daraja credentials not configured. ' +
                'Set DARAJA_CONSUMER_KEY and DARAJA_CONSUMER_SECRET in .env.');
        }
        const credentials = Buffer.from(`${key}:${secret}`).toString('base64');
        const url = `${this.getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`;
        this.logger.log(`[Daraja] Requesting access token from ${url}`);
        const response = await (0, rxjs_1.firstValueFrom)(this.http.get(url, {
            headers: { Authorization: `Basic ${credentials}` },
            timeout: 10_000,
        }));
        this.logger.log(`[Daraja] Access token generated successfully`);
        return response.data.access_token;
    }
    async initiateSTKPush(transactionId, phoneNumber, amountCents) {
        const tx = await this.prisma.transaction.findUnique({
            where: { id: transactionId },
        });
        if (!tx)
            throw new common_1.NotFoundException(`Transaction ${transactionId} not found`);
        const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
        const accessToken = await this.getAccessToken();
        const shortcode = this.config.get('DARAJA_SHORTCODE');
        const passkey = this.config.get('DARAJA_PASSKEY');
        const callbackUrl = this.config.get('DARAJA_CALLBACK_URL');
        const transactionType = this.config.get('DARAJA_TRANSACTION_TYPE') || 'CustomerBuyGoodsOnline';
        if (!shortcode || !passkey || !callbackUrl) {
            throw new common_1.ServiceUnavailableException('Daraja shortcode, passkey or callback URL not configured in .env');
        }
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }));
        const timestamp = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0'),
            String(now.getHours()).padStart(2, '0'),
            String(now.getMinutes()).padStart(2, '0'),
            String(now.getSeconds()).padStart(2, '0'),
        ].join('');
        const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
        const amountKes = Math.max(1, Math.ceil(amountCents / 100));
        const payload = {
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: transactionType,
            Amount: amountKes,
            PartyA: normalizedPhone,
            PartyB: shortcode,
            PhoneNumber: normalizedPhone,
            CallBackURL: callbackUrl,
            AccountReference: transactionId.slice(0, 12),
            TransactionDesc: `POS payment ${transactionId.slice(0, 8)}`,
        };
        const url = `${this.getBaseUrl()}/mpesa/stkpush/v1/processrequest`;
        this.logger.log(`[Daraja] POST ${url} with shortcode ${shortcode} to ${normalizedPhone}`);
        const response = await (0, rxjs_1.firstValueFrom)(this.http.post(url, payload, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            timeout: 15_000,
        }));
        this.logger.log(`[Daraja] STK Push response: Code=${response.data.ResponseCode}, CheckoutRequestID=${response.data.CheckoutRequestID}`);
        if (response.data.ResponseCode !== '0') {
            throw new common_1.BadRequestException(`Daraja STK Push rejected: ${response.data.ResponseDescription}`);
        }
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
    async handleCallback(body) {
        const callback = body?.Body?.stkCallback;
        if (!callback || !callback.CheckoutRequestID) {
            this.logger.warn('[Daraja] Callback received with missing stkCallback structure');
            throw new common_1.BadRequestException('Invalid callback payload: missing stkCallback');
        }
        const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;
        this.logger.log(`[Daraja] Callback received: CheckoutRequestID=${CheckoutRequestID} ` +
            `ResultCode=${ResultCode} ResultDesc=${ResultDesc}`);
        const payment = await this.prisma.payment.findFirst({
            where: {
                checkoutRequestId: CheckoutRequestID,
                status: 'pending',
            },
        });
        if (!payment) {
            this.logger.warn(`[Daraja] REJECTED callback - no pending payment found for CheckoutRequestID=${CheckoutRequestID}`);
            throw new common_1.NotFoundException(`No pending payment found for CheckoutRequestID: ${CheckoutRequestID}`);
        }
        if (ResultCode === 0) {
            const items = CallbackMetadata?.Item ?? [];
            const get = (name) => items.find((i) => i.Name === name)?.Value ?? null;
            const mpesaReceiptNumber = get('MpesaReceiptNumber');
            const mpesaPhone = get('PhoneNumber');
            this.logger.log(`[Daraja] Payment CAPTURED: receipt=${mpesaReceiptNumber} phone=${mpesaPhone}`);
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
        }
        else {
            this.logger.warn(`[Daraja] Payment FAILED: CheckoutRequestID=${CheckoutRequestID} reason="${ResultDesc}"`);
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: { status: 'failed' },
            });
            return { acknowledged: true };
        }
    }
    async createTillPayment(transactionId, mpesaCode, amountCents) {
        const tx = await this.prisma.transaction.findUnique({
            where: { id: transactionId },
        });
        if (!tx)
            throw new common_1.NotFoundException(`Transaction ${transactionId} not found`);
        const formattedCode = mpesaCode.trim().toUpperCase();
        const existing = await this.prisma.payment.findFirst({
            where: { mpesaReceiptNumber: formattedCode },
        });
        if (existing) {
            throw new common_1.BadRequestException(`M-Pesa code ${formattedCode} has already been recorded (payment ${existing.id})`);
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
        this.logger.log(`[MpesaTill] Created captured payment ${payment.id} for code ${formattedCode} on transaction ${transactionId}`);
        return payment;
    }
    async getPaymentStatus(id) {
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
        if (!payment)
            throw new common_1.NotFoundException(`Payment ${id} not found`);
        return payment;
    }
    async reconcileTillPayment(paymentId) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
        });
        if (!payment)
            throw new common_1.NotFoundException(`Payment ${paymentId} not found`);
        if (payment.status !== 'awaiting_confirmation' && payment.status !== 'pending') {
            return {
                message: `Payment ${paymentId} is already in terminal status: ${payment.status}`,
                payment,
            };
        }
        if (payment.method === 'mpesa_till' || !payment.checkoutRequestId) {
            return {
                message: 'Till payment manual reconciliation: verify transaction code against M-Pesa statement.',
                payment,
                requiresManualReconciliation: true,
            };
        }
        const accessToken = await this.getAccessToken();
        const shortcode = this.config.get('DARAJA_SHORTCODE');
        const passkey = this.config.get('DARAJA_PASSKEY');
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }));
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
        const response = await (0, rxjs_1.firstValueFrom)(this.http.post(url, queryPayload, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            timeout: 10_000,
        }));
        const resultCode = String(response.data.ResultCode);
        if (resultCode === '0') {
            const updated = await this.prisma.payment.update({
                where: { id: paymentId },
                data: { status: 'captured' },
            });
            await this.finalizeTransaction(payment.transactionId);
            return { message: 'Reconciled: payment captured', payment: updated, darajaResponse: response.data };
        }
        else {
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
    async finalizeTransaction(transactionId) {
        try {
            const tx = await this.prisma.transaction.findUnique({
                where: { id: transactionId },
                include: { lineItems: true },
            });
            if (!tx || tx.status === 'COMPLETED')
                return;
            await this.prisma.transaction.update({
                where: { id: transactionId },
                data: {
                    status: 'COMPLETED',
                    syncedAt: new Date(),
                },
            });
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
            try {
                await this.prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW CONCURRENTLY current_inventory');
            }
            catch {
                try {
                    await this.prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW current_inventory');
                }
                catch { }
            }
        }
        catch (err) {
            this.logger.error(`Failed to finalize transaction ${transactionId}: ${err.message}`);
        }
    }
};
exports.MpesaService = MpesaService;
exports.MpesaService = MpesaService = MpesaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService,
        prisma_service_1.PrismaService])
], MpesaService);
//# sourceMappingURL=mpesa.service.js.map
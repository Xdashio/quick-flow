import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
export interface DarajaTokenResponse {
    access_token: string;
    expires_in: string;
}
export interface DarajaStkPushResponse {
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResponseCode: string;
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
    ResultCode: number;
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
export declare class MpesaService {
    private readonly config;
    private readonly http;
    private readonly prisma;
    private readonly logger;
    constructor(config: ConfigService, http: HttpService, prisma: PrismaService);
    private getBaseUrl;
    normalizePhoneNumber(raw: string): string;
    getAccessToken(): Promise<string>;
    initiateSTKPush(transactionId: string, phoneNumber: string, amountCents: number): Promise<{
        darajaResponse: DarajaStkPushResponse;
        payment: {
            id: string;
            method: string;
            amountCents: number;
            mpesaReceiptNumber: string | null;
            mpesaPhoneNumber: string | null;
            checkoutRequestId: string | null;
            etimsInvoiceNumber: string | null;
            status: string;
            transactionId: string;
        };
    }>;
    handleCallback(body: Record<string, any>): Promise<{
        acknowledged: boolean;
    }>;
    createTillPayment(transactionId: string, mpesaCode: string, amountCents: number): Promise<{
        id: string;
        method: string;
        amountCents: number;
        mpesaReceiptNumber: string | null;
        mpesaPhoneNumber: string | null;
        checkoutRequestId: string | null;
        etimsInvoiceNumber: string | null;
        status: string;
        transactionId: string;
    }>;
    getPaymentStatus(id: string): Promise<{
        transaction: {
            lineItems: ({
                product: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    sku: string;
                    barcode: string | null;
                    description: string | null;
                    unitType: string;
                    isWeighed: boolean;
                    priceCents: number;
                    taxCategoryId: string | null;
                    categoryId: string | null;
                    imageKey: string | null;
                    reorderPoint: number | null;
                    costCents: number | null;
                    active: boolean;
                    updatedAt: Date;
                };
            } & {
                id: string;
                transactionId: string;
                productId: string;
                quantity: import("@prisma/client-runtime-utils").Decimal;
                unitPriceCents: number;
                unitCostCents: number | null;
                taxRateBp: number;
                discountCents: number;
                lineTotalCents: number;
            })[];
        } & {
            id: string;
            status: string;
            locationId: string;
            registerId: string | null;
            cashierId: string | null;
            subtotalCents: number;
            taxCents: number;
            totalCents: number;
            customerId: string | null;
            voidedReason: string | null;
            parentTransactionId: string | null;
            createdAt: Date;
            syncedAt: Date | null;
        };
    } & {
        id: string;
        method: string;
        amountCents: number;
        mpesaReceiptNumber: string | null;
        mpesaPhoneNumber: string | null;
        checkoutRequestId: string | null;
        etimsInvoiceNumber: string | null;
        status: string;
        transactionId: string;
    }>;
    reconcileTillPayment(paymentId: string): Promise<{
        message: string;
        payment: {
            id: string;
            method: string;
            amountCents: number;
            mpesaReceiptNumber: string | null;
            mpesaPhoneNumber: string | null;
            checkoutRequestId: string | null;
            etimsInvoiceNumber: string | null;
            status: string;
            transactionId: string;
        };
        requiresManualReconciliation?: undefined;
        darajaResponse?: undefined;
    } | {
        message: string;
        payment: {
            id: string;
            method: string;
            amountCents: number;
            mpesaReceiptNumber: string | null;
            mpesaPhoneNumber: string | null;
            checkoutRequestId: string | null;
            etimsInvoiceNumber: string | null;
            status: string;
            transactionId: string;
        };
        requiresManualReconciliation: boolean;
        darajaResponse?: undefined;
    } | {
        message: string;
        payment: {
            id: string;
            method: string;
            amountCents: number;
            mpesaReceiptNumber: string | null;
            mpesaPhoneNumber: string | null;
            checkoutRequestId: string | null;
            etimsInvoiceNumber: string | null;
            status: string;
            transactionId: string;
        };
        darajaResponse: DarajaStkQueryResponse;
        requiresManualReconciliation?: undefined;
    }>;
    private finalizeTransaction;
}

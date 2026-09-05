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
            status: string;
            transactionId: string;
            method: string;
            amountCents: number;
            mpesaReceiptNumber: string | null;
            mpesaPhoneNumber: string | null;
            checkoutRequestId: string | null;
            etimsInvoiceNumber: string | null;
        };
    }>;
    handleCallback(body: Record<string, any>): Promise<{
        acknowledged: boolean;
    }>;
    createTillPayment(transactionId: string, mpesaCode: string, amountCents: number): Promise<{
        id: string;
        status: string;
        transactionId: string;
        method: string;
        amountCents: number;
        mpesaReceiptNumber: string | null;
        mpesaPhoneNumber: string | null;
        checkoutRequestId: string | null;
        etimsInvoiceNumber: string | null;
    }>;
    getPaymentStatus(id: string): Promise<{
        transaction: {
            lineItems: ({
                product: {
                    name: string;
                    sku: string;
                    barcode: string | null;
                    description: string | null;
                    unitType: string;
                    isWeighed: boolean;
                    priceCents: number;
                    costCents: number | null;
                    taxCategoryId: string | null;
                    categoryId: string | null;
                    active: boolean;
                    imageKey: string | null;
                    reorderPoint: number | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: string;
                productId: string;
                quantity: import("@prisma/client-runtime-utils").Decimal;
                unitPriceCents: number;
                discountCents: number;
                taxRateBp: number;
                lineTotalCents: number;
                unitCostCents: number | null;
                transactionId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            locationId: string;
            registerId: string | null;
            cashierId: string | null;
            customerId: string | null;
            status: string;
            subtotalCents: number;
            taxCents: number;
            totalCents: number;
            voidedReason: string | null;
            parentTransactionId: string | null;
            syncedAt: Date | null;
        };
    } & {
        id: string;
        status: string;
        transactionId: string;
        method: string;
        amountCents: number;
        mpesaReceiptNumber: string | null;
        mpesaPhoneNumber: string | null;
        checkoutRequestId: string | null;
        etimsInvoiceNumber: string | null;
    }>;
    reconcileTillPayment(paymentId: string): Promise<{
        message: string;
        payment: {
            id: string;
            status: string;
            transactionId: string;
            method: string;
            amountCents: number;
            mpesaReceiptNumber: string | null;
            mpesaPhoneNumber: string | null;
            checkoutRequestId: string | null;
            etimsInvoiceNumber: string | null;
        };
        requiresManualReconciliation?: undefined;
        darajaResponse?: undefined;
    } | {
        message: string;
        payment: {
            id: string;
            status: string;
            transactionId: string;
            method: string;
            amountCents: number;
            mpesaReceiptNumber: string | null;
            mpesaPhoneNumber: string | null;
            checkoutRequestId: string | null;
            etimsInvoiceNumber: string | null;
        };
        requiresManualReconciliation: boolean;
        darajaResponse?: undefined;
    } | {
        message: string;
        payment: {
            id: string;
            status: string;
            transactionId: string;
            method: string;
            amountCents: number;
            mpesaReceiptNumber: string | null;
            mpesaPhoneNumber: string | null;
            checkoutRequestId: string | null;
            etimsInvoiceNumber: string | null;
        };
        darajaResponse: DarajaStkQueryResponse;
        requiresManualReconciliation?: undefined;
    }>;
    private finalizeTransaction;
}

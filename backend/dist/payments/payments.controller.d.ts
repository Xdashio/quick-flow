import { PaymentsService } from './payments.service';
import { MpesaService } from './mpesa.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { StkPushDto } from './dto/stk-push.dto';
import { TillPaymentDto } from './dto/till-payment.dto';
export declare class PaymentsController {
    private readonly service;
    private readonly mpesa;
    constructor(service: PaymentsService, mpesa: MpesaService);
    create(dto: CreatePaymentDto): Promise<{
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
    findAll(transactionId?: string): Promise<{
        id: string;
        status: string;
        transactionId: string;
        method: string;
        amountCents: number;
        mpesaReceiptNumber: string | null;
        mpesaPhoneNumber: string | null;
        checkoutRequestId: string | null;
        etimsInvoiceNumber: string | null;
    }[]>;
    findOne(id: string): Promise<{
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
    getStatus(id: string): Promise<{
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
    stkPush(dto: StkPushDto): Promise<{
        darajaResponse: import("./mpesa.service").DarajaStkPushResponse;
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
    mpesaCallback(body: Record<string, any>): Promise<{
        acknowledged: boolean;
    }>;
    tillPayment(dto: TillPaymentDto): Promise<{
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
    reconcile(paymentId: string): Promise<{
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
        darajaResponse: import("./mpesa.service").DarajaStkQueryResponse;
        requiresManualReconciliation?: undefined;
    }>;
}

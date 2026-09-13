import { CheckoutService } from './checkout.service';
import { CashSaleDto } from './dto/cash-sale.dto';
import { MpesaStkSaleDto } from './dto/mpesa-stk-sale.dto';
import { MpesaTillSaleDto } from './dto/mpesa-till-sale.dto';
export declare class CheckoutController {
    private readonly service;
    constructor(service: CheckoutService);
    cashSale(dto: CashSaleDto): Promise<{
        transaction: {
            lineItems: ({
                product: {
                    name: string;
                    id: string;
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
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                productId: string;
                id: string;
                quantity: import("@prisma/client-runtime-utils").Decimal;
                unitPriceCents: number;
                discountCents: number;
                taxRateBp: number;
                lineTotalCents: number;
                unitCostCents: number | null;
                transactionId: string;
            })[];
            payments: {
                id: string;
                status: string;
                transactionId: string;
                method: string;
                amountCents: number;
                mpesaReceiptNumber: string | null;
                mpesaPhoneNumber: string | null;
                checkoutRequestId: string | null;
                etimsInvoiceNumber: string | null;
            }[];
        } & {
            locationId: string;
            id: string;
            createdAt: Date;
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
        drawerEvent: {
            reason: string;
            id: string;
            createdAt: Date;
            registerId: string | null;
            amountCents: number | null;
            userId: string | null;
        };
        changeDueCents: number;
        amountTenderedCents: number;
        receipt: any;
    }>;
    mpesaStkSale(dto: MpesaStkSaleDto): Promise<{
        transaction: {
            lineItems: ({
                product: {
                    name: string;
                    id: string;
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
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                productId: string;
                id: string;
                quantity: import("@prisma/client-runtime-utils").Decimal;
                unitPriceCents: number;
                discountCents: number;
                taxRateBp: number;
                lineTotalCents: number;
                unitCostCents: number | null;
                transactionId: string;
            })[];
        } & {
            locationId: string;
            id: string;
            createdAt: Date;
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
        darajaResponse: import("../payments/mpesa.service").DarajaStkPushResponse;
    }>;
    mpesaTillSale(dto: MpesaTillSaleDto): Promise<{
        transaction: {
            lineItems: ({
                product: {
                    name: string;
                    id: string;
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
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                productId: string;
                id: string;
                quantity: import("@prisma/client-runtime-utils").Decimal;
                unitPriceCents: number;
                discountCents: number;
                taxRateBp: number;
                lineTotalCents: number;
                unitCostCents: number | null;
                transactionId: string;
            })[];
        } & {
            locationId: string;
            id: string;
            createdAt: Date;
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
        receipt: any;
    }>;
    completeMpesaSale(paymentId: string): Promise<{
        transaction: {
            lineItems: ({
                product: {
                    name: string;
                    id: string;
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
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                productId: string;
                id: string;
                quantity: import("@prisma/client-runtime-utils").Decimal;
                unitPriceCents: number;
                discountCents: number;
                taxRateBp: number;
                lineTotalCents: number;
                unitCostCents: number | null;
                transactionId: string;
            })[];
        } & {
            locationId: string;
            id: string;
            createdAt: Date;
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
        payment: {
            transaction: {
                lineItems: ({
                    product: {
                        name: string;
                        id: string;
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
                        createdAt: Date;
                        updatedAt: Date;
                    };
                } & {
                    productId: string;
                    id: string;
                    quantity: import("@prisma/client-runtime-utils").Decimal;
                    unitPriceCents: number;
                    discountCents: number;
                    taxRateBp: number;
                    lineTotalCents: number;
                    unitCostCents: number | null;
                    transactionId: string;
                })[];
            } & {
                locationId: string;
                id: string;
                createdAt: Date;
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
        };
        receipt: any;
    }>;
    openDrawer(dto: {
        registerId?: string;
        userId?: string;
        reason: string;
        amountCents?: number;
    }): Promise<{
        reason: string;
        id: string;
        createdAt: Date;
        registerId: string | null;
        amountCents: number | null;
        userId: string | null;
    }>;
}

import { PrismaService } from '../prisma/prisma.service';
import { PrinterService } from '../hardware/printer.service';
import { MpesaService } from '../payments/mpesa.service';
import { CashSaleDto } from './dto/cash-sale.dto';
import { MpesaStkSaleDto } from './dto/mpesa-stk-sale.dto';
import { MpesaTillSaleDto } from './dto/mpesa-till-sale.dto';
export declare class CheckoutService {
    private prisma;
    private printer;
    private mpesa;
    private readonly logger;
    constructor(prisma: PrismaService, printer: PrinterService, mpesa: MpesaService);
    cashSale(dto: CashSaleDto): Promise<{
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
            id: string;
            createdAt: Date;
            registerId: string | null;
            amountCents: number | null;
            reason: string;
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
        payment: {
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
        };
        receipt: any;
    }>;
    logDrawerEvent(dto: {
        registerId?: string;
        userId?: string;
        reason: string;
        amountCents?: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        registerId: string | null;
        amountCents: number | null;
        reason: string;
        userId: string | null;
    }>;
}

import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
export declare const ALL_STATUSES: string[];
export declare class TransactionsService {
    private prisma;
    constructor(prisma: PrismaService);
    private assertValidStatus;
    private assertTransition;
    create(dto: CreateTransactionDto): Promise<{
        lineItems: {
            productId: string;
            id: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            unitPriceCents: number;
            discountCents: number;
            taxRateBp: number;
            lineTotalCents: number;
            unitCostCents: number | null;
            transactionId: string;
        }[];
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
    }>;
    findAll(): Promise<({
        lineItems: {
            productId: string;
            id: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            unitPriceCents: number;
            discountCents: number;
            taxRateBp: number;
            lineTotalCents: number;
            unitCostCents: number | null;
            transactionId: string;
        }[];
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
    })[]>;
    findOne(id: string): Promise<{
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
    }>;
    update(id: string, dto: UpdateTransactionDto): Promise<{
        lineItems: {
            productId: string;
            id: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            unitPriceCents: number;
            discountCents: number;
            taxRateBp: number;
            lineTotalCents: number;
            unitCostCents: number | null;
            transactionId: string;
        }[];
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
    }>;
    remove(id: string): Promise<{
        deleted: boolean;
        id: string;
    }>;
}

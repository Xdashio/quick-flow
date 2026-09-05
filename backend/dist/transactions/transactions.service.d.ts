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
            id: string;
            productId: string;
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
    }>;
    findAll(): Promise<({
        lineItems: {
            id: string;
            productId: string;
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
    })[]>;
    findOne(id: string): Promise<{
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
    }>;
    update(id: string, dto: UpdateTransactionDto): Promise<{
        lineItems: {
            id: string;
            productId: string;
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
    }>;
    remove(id: string): Promise<{
        deleted: boolean;
        id: string;
    }>;
}

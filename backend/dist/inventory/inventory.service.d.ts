import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { ProductStockDetailDto } from './dto/product-stock-detail.dto';
export declare class InventoryService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createMovement(dto: CreateMovementDto): Promise<{
        movement: {
            productId: string;
            locationId: string;
            quantityDelta: Prisma.Decimal;
            reason: string;
            referenceId: string | null;
            createdBy: string | null;
            id: string;
            createdAt: Date;
        };
        currentStock: {
            productId: string;
            locationId: string;
            quantity: string;
        }[] | {
            productId: string;
            locationId: string;
            quantity: string;
        } | {
            productId: string;
            locationId: null;
            quantity: string;
        }[];
    }>;
    refreshMaterializedView(): Promise<void>;
    getCurrentStock(productId: string, locationId?: string): Promise<{
        productId: string;
        locationId: string;
        quantity: string;
    }[] | {
        productId: string;
        locationId: string;
        quantity: string;
    } | {
        productId: string;
        locationId: null;
        quantity: string;
    }[]>;
    getLowStock(): Promise<{
        productId: string;
        sku: string;
        name: string;
        unitType: string;
        reorderPoint: number;
        currentStock: number;
    }[]>;
    listMovements(productId?: string, locationId?: string): Promise<{
        productId: string;
        locationId: string;
        quantityDelta: Prisma.Decimal;
        reason: string;
        referenceId: string | null;
        createdBy: string | null;
        id: string;
        createdAt: Date;
    }[]>;
    getTotalStockMap(productIds?: string[]): Promise<Map<string, number>>;
    getProductStockDetails(productId: string): Promise<ProductStockDetailDto>;
    recordInitialStock(productId: string, locationId: string, quantity: number, createdBy?: string, tx?: Prisma.TransactionClient | PrismaService): Promise<{
        productId: string;
        locationId: string;
        quantityDelta: Prisma.Decimal;
        reason: string;
        referenceId: string | null;
        createdBy: string | null;
        id: string;
        createdAt: Date;
    }>;
}

import { PrismaService } from '../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';
export declare class InventoryService {
    private prisma;
    constructor(prisma: PrismaService);
    createMovement(dto: CreateMovementDto): Promise<{
        movement: {
            id: string;
            createdAt: Date;
            productId: string;
            locationId: string;
            quantityDelta: import("@prisma/client-runtime-utils").Decimal;
            reason: string;
            referenceId: string | null;
            createdBy: string | null;
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
        id: string;
        createdAt: Date;
        productId: string;
        locationId: string;
        quantityDelta: import("@prisma/client-runtime-utils").Decimal;
        reason: string;
        referenceId: string | null;
        createdBy: string | null;
    }[]>;
}

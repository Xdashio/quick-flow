import { InventoryService } from './inventory.service';
import { CreateMovementDto } from './dto/create-movement.dto';
export declare class InventoryController {
    private readonly service;
    constructor(service: InventoryService);
    create(dto: CreateMovementDto): Promise<{
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
    getCurrent(productId: string, locationId?: string): Promise<{
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
    list(productId?: string, locationId?: string): Promise<{
        id: string;
        createdAt: Date;
        productId: string;
        locationId: string;
        quantityDelta: import("@prisma/client-runtime-utils").Decimal;
        reason: string;
        referenceId: string | null;
        createdBy: string | null;
    }[]>;
    lowStock(): Promise<{
        productId: string;
        sku: string;
        name: string;
        unitType: string;
        reorderPoint: number;
        currentStock: number;
    }[]>;
}

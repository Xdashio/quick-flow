import { PrismaService } from '../prisma/prisma.service';
import { R2Service } from '../images/r2.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class ProductsService {
    private prisma;
    private r2;
    private inventory;
    constructor(prisma: PrismaService, r2: R2Service, inventory: InventoryService);
    private withComputed;
    create(dto: CreateProductDto): Promise<{
        totalStock: number;
        taxCategory: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            rateBp: number;
        } | null;
        category: {
            name: string;
            id: string;
            parentId: string | null;
        } | null;
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
    } & {
        imageUrl: string | null;
        profitCents: number | null;
        marginPct: number | null;
    }>;
    findAll(): Promise<({
        totalStock: number;
        taxCategory: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            rateBp: number;
        } | null;
        category: {
            name: string;
            id: string;
            parentId: string | null;
        } | null;
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
    } & {
        imageUrl: string | null;
        profitCents: number | null;
        marginPct: number | null;
    })[]>;
    findOne(id: string): Promise<{
        totalStock: number;
        taxCategory: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            rateBp: number;
        } | null;
        category: {
            name: string;
            id: string;
            parentId: string | null;
        } | null;
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
    } & {
        imageUrl: string | null;
        profitCents: number | null;
        marginPct: number | null;
    }>;
    findByBarcode(barcode: string): Promise<{
        totalStock: number;
        taxCategory: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            rateBp: number;
        } | null;
        category: {
            name: string;
            id: string;
            parentId: string | null;
        } | null;
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
    } & {
        imageUrl: string | null;
        profitCents: number | null;
        marginPct: number | null;
    }>;
    update(id: string, dto: UpdateProductDto): Promise<{
        totalStock: number;
        taxCategory: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            rateBp: number;
        } | null;
        category: {
            name: string;
            id: string;
            parentId: string | null;
        } | null;
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
    } & {
        imageUrl: string | null;
        profitCents: number | null;
        marginPct: number | null;
    }>;
    remove(id: string): Promise<{
        deleted: boolean;
        id: string;
        deactivated?: undefined;
        product?: undefined;
    } | {
        deleted: boolean;
        deactivated: boolean;
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
        } & {
            imageUrl: string | null;
            profitCents: number | null;
            marginPct: number | null;
        };
        id?: undefined;
    }>;
}

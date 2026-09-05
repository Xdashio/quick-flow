import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    create(dto: CreateProductDto): Promise<{
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
    } & {
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
    } & {
        imageUrl: string | null;
        profitCents: number | null;
        marginPct: number | null;
    }>;
    findAll(): Promise<({
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
    } & {
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
    } & {
        imageUrl: string | null;
        profitCents: number | null;
        marginPct: number | null;
    })[]>;
    findByBarcode(barcode: string): Promise<{
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
    } & {
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
    } & {
        imageUrl: string | null;
        profitCents: number | null;
        marginPct: number | null;
    }>;
    findOne(id: string): Promise<{
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
    } & {
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
    } & {
        imageUrl: string | null;
        profitCents: number | null;
        marginPct: number | null;
    }>;
    update(id: string, dto: UpdateProductDto): Promise<{
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
    } & {
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
        } & {
            imageUrl: string | null;
            profitCents: number | null;
            marginPct: number | null;
        };
        id?: undefined;
    }>;
}

export declare class CreateProductDto {
    sku: string;
    barcode?: string;
    name: string;
    description?: string;
    unitType?: string;
    isWeighed?: boolean;
    priceCents: number;
    costCents?: number;
    taxCategoryId?: string;
    categoryId?: string;
    active?: boolean;
    imageKey?: string;
    reorderPoint?: number;
}

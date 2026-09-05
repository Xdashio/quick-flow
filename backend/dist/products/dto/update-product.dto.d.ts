export declare class UpdateProductDto {
    sku?: string;
    barcode?: string;
    name?: string;
    description?: string;
    unitType?: string;
    isWeighed?: boolean;
    priceCents?: number;
    costCents?: number | null;
    taxCategoryId?: string;
    categoryId?: string | null;
    active?: boolean;
    imageKey?: string | null;
    reorderPoint?: number | null;
}

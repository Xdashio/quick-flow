export declare class CalculateTaxLineItemDto {
    productId: string;
    quantity: number;
    unitPriceCents?: number;
    discountCents?: number;
}
export declare class CalculateTaxDto {
    lineItems: CalculateTaxLineItemDto[];
}

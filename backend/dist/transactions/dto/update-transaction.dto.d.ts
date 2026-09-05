export declare class UpdateLineItemDto {
    productId: string;
    quantity: number;
    unitPriceCents: number;
    taxRateBp: number;
    discountCents?: number;
    lineTotalCents: number;
}
export declare class UpdateTransactionDto {
    status?: string;
    voidedReason?: string;
    subtotalCents?: number;
    taxCents?: number;
    totalCents?: number;
    customerId?: string;
    lineItems?: UpdateLineItemDto[];
}

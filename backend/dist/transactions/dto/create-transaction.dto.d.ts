export declare class CreateLineItemDto {
    productId: string;
    quantity: number;
    unitPriceCents?: number;
    taxRateBp?: number;
    discountCents?: number;
    lineTotalCents?: number;
}
export declare class CreateTransactionDto {
    id?: string;
    locationId: string;
    registerId?: string;
    cashierId?: string;
    customerId?: string;
    status?: string;
    subtotalCents?: number;
    taxCents?: number;
    totalCents?: number;
    voidedReason?: string;
    parentTransactionId?: string;
    lineItems?: CreateLineItemDto[];
    createdAt?: string;
}

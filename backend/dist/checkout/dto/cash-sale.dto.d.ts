export declare class CashSaleLineItemDto {
    productId: string;
    quantity: number;
    unitPriceCents: number;
    taxRateBp: number;
    discountCents?: number;
    lineTotalCents: number;
}
export declare class CashSaleDto {
    id?: string;
    locationId: string;
    registerId?: string;
    cashierId?: string;
    customerId?: string;
    subtotalCents: number;
    taxCents: number;
    totalCents: number;
    lineItems: CashSaleLineItemDto[];
    amountTenderedCents: number;
    createdAt?: string;
    note?: string;
}

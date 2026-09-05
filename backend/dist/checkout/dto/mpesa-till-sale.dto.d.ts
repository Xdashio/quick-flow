export declare class MpesaTillSaleLineItemDto {
    productId: string;
    quantity: number;
    unitPriceCents: number;
    taxRateBp: number;
    discountCents?: number;
    lineTotalCents: number;
}
export declare class MpesaTillSaleDto {
    id?: string;
    locationId: string;
    registerId?: string;
    cashierId?: string;
    customerId?: string;
    subtotalCents: number;
    taxCents: number;
    totalCents: number;
    lineItems: MpesaTillSaleLineItemDto[];
    mpesaCode: string;
    createdAt?: string;
    note?: string;
}

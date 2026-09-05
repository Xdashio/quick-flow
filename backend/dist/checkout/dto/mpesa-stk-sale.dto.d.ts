export declare class MpesaStkSaleLineItemDto {
    productId: string;
    quantity: number;
    unitPriceCents: number;
    taxRateBp: number;
    discountCents?: number;
    lineTotalCents: number;
}
export declare class MpesaStkSaleDto {
    id?: string;
    locationId: string;
    registerId?: string;
    cashierId?: string;
    customerId?: string;
    subtotalCents: number;
    taxCents: number;
    totalCents: number;
    lineItems: MpesaStkSaleLineItemDto[];
    phoneNumber: string;
    createdAt?: string;
    note?: string;
}

export interface LocationStockDto {
    locationId: string;
    locationName: string;
    quantity: number;
}
export interface ProductStockDetailDto {
    productId: string;
    totalStock: number;
    locations: LocationStockDto[];
}

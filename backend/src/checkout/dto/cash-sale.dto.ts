import {
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CashSaleLineItemDto {
  @IsUUID()
  productId!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsInt()
  @Min(0)
  unitPriceCents!: number;

  @IsInt()
  @Min(0)
  taxRateBp!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  discountCents?: number;

  @IsInt()
  @Min(0)
  lineTotalCents!: number;
}

export class CashSaleDto {
  @IsOptional()
  @IsUUID()
  id?: string; // client-generated UUID for idempotency; generated server-side if absent

  @IsUUID()
  locationId!: string;

  @IsOptional()
  @IsUUID()
  registerId?: string;

  @IsOptional()
  @IsUUID()
  cashierId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsInt()
  @Min(0)
  subtotalCents!: number;

  @IsInt()
  @Min(0)
  taxCents!: number;

  @IsInt()
  @Min(0)
  totalCents!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CashSaleLineItemDto)
  lineItems!: CashSaleLineItemDto[];

  // Cash specific — integer cents math
  @IsInt()
  @Min(0)
  amountTenderedCents!: number;

  @IsOptional()
  @IsString()
  createdAt?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

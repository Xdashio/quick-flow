import {
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MpesaTillSaleLineItemDto {
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

export class MpesaTillSaleDto {
  @IsOptional()
  @IsUUID()
  id?: string;

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
  @Type(() => MpesaTillSaleLineItemDto)
  lineItems!: MpesaTillSaleLineItemDto[];

  @IsString()
  @Matches(/^[A-Za-z0-9]{8,14}$/, {
    message: 'mpesaCode must be a valid M-Pesa transaction code (e.g. QHN7ACKQOP)',
  })
  mpesaCode!: string;

  @IsOptional()
  @IsString()
  createdAt?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

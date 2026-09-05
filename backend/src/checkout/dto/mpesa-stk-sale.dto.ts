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

export class MpesaStkSaleLineItemDto {
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

export class MpesaStkSaleDto {
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
  @Type(() => MpesaStkSaleLineItemDto)
  lineItems!: MpesaStkSaleLineItemDto[];

  @IsString()
  @Matches(/^(?:\+?254|0)?[71]\d{8}$/, {
    message: 'phoneNumber must be a valid Kenyan mobile number',
  })
  phoneNumber!: string;

  @IsOptional()
  @IsString()
  createdAt?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

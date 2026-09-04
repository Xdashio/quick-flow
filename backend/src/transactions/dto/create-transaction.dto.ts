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

export class CreateLineItemDto {
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

export class CreateTransactionDto {
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

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  subtotalCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  taxCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalCents?: number;

  @IsOptional()
  @IsString()
  voidedReason?: string;

  @IsOptional()
  @IsUUID()
  parentTransactionId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLineItemDto)
  lineItems?: CreateLineItemDto[];

  @IsOptional()
  createdAt?: string; // ISO timestamp, optional – server will default to now if not provided
}

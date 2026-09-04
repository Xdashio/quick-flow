import {
  IsString,
  IsOptional,
  IsInt,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateLineItemDto {
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

export class UpdateTransactionDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  voidedReason?: string;

  @IsOptional()
  @IsInt()
  subtotalCents?: number;

  @IsOptional()
  @IsInt()
  taxCents?: number;

  @IsOptional()
  @IsInt()
  totalCents?: number;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateLineItemDto)
  lineItems?: UpdateLineItemDto[];
}

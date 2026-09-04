import {
  IsUUID,
  IsNumber,
  IsOptional,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CalculateTaxLineItemDto {
  @IsUUID()
  productId!: string;

  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  unitPriceCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  discountCents?: number;
}

export class CalculateTaxDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CalculateTaxLineItemDto)
  lineItems!: CalculateTaxLineItemDto[];
}

import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  IsIn,
  MaxLength,
  Min,
  IsNull,
} from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sku?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  barcode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(['each', 'kg', 'lb', 'oz'])
  unitType?: string;

  @IsOptional()
  @IsBoolean()
  isWeighed?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number;

  @IsOptional()
  @IsUUID()
  taxCategoryId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  /**
   * R2 object key. Pass null to clear the image, or omit to leave unchanged.
   * Pass the new key to replace (old object will be deleted from R2 automatically).
   */
  @IsOptional()
  @IsString()
  @MaxLength(512)
  imageKey?: string | null;
}
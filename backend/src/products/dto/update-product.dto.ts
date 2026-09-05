import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  IsIn,
  MaxLength,
  Min,
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

  /**
   * Buying/cost price in cents — pass a number to set/change it, null to
   * clear it, or omit to leave unchanged.
   */
  @IsOptional()
  @IsInt()
  @Min(0)
  costCents?: number | null;

  @IsOptional()
  @IsUUID()
  taxCategoryId?: string;

  /** Pass a category id to assign, null to uncategorize, or omit to leave unchanged. */
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

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

  /**
   * Reorder threshold — pass a number to set/change it, null to stop
   * tracking this product for low-stock alerts, or omit to leave unchanged.
   */
  @IsOptional()
  @IsInt()
  @Min(0)
  reorderPoint?: number | null;
}
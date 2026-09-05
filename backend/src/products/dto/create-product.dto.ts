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

export class CreateProductDto {
  @IsString()
  @MaxLength(64)
  sku!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  barcode?: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(['each', 'kg', 'g', 'lb', 'oz', 'litre', 'ml', 'dozen', 'pack', 'box'])
  unitType?: string;

  @IsOptional()
  @IsBoolean()
  isWeighed?: boolean;

  @IsInt()
  @Min(0)
  priceCents!: number;

  /** Buying/cost price in cents. Omit if cost isn't tracked yet. */
  @IsOptional()
  @IsInt()
  @Min(0)
  costCents?: number;

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
   * R2 object key set after a successful pre-signed upload.
   * e.g. "products/uuid/random.jpg"
   * The full CDN URL is derived server-side — never stored here.
   */
  @IsOptional()
  @IsString()
  @MaxLength(512)
  imageKey?: string;

  /**
   * Reorder threshold — when total stock across locations falls at or
   * below this, the product appears on GET /inventory/low-stock.
   * Omit to leave the product untracked for low-stock alerts.
   */
  @IsOptional()
  @IsInt()
  @Min(0)
  reorderPoint?: number;
}
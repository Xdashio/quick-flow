import {
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  IsIn,
} from 'class-validator';

export class CreateMovementDto {
  @IsUUID()
  productId!: string;

  @IsUUID()
  locationId!: string;

  @IsNumber()
  quantityDelta!: number; // signed, NUMERIC(10,3) – supports weighed items

  @IsString()
  @IsIn(['sale', 'return', 'receiving', 'shrinkage', 'adjustment', 'waste'])
  reason!: string;

  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @IsOptional()
  @IsUUID()
  createdBy?: string;
}

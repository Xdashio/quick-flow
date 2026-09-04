import { IsString, IsInt, IsOptional, MaxLength, Min, Max } from 'class-validator';

export class UpdateTaxCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  rateBp?: number;
}

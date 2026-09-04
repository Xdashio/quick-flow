import { IsString, IsInt, MaxLength, Min, Max } from 'class-validator';

export class CreateTaxCategoryDto {
  @IsString()
  @MaxLength(64)
  name!: string;

  @IsInt()
  @Min(0)
  @Max(10000)
  rateBp!: number; // basis points e.g. 1600 = 16%
}

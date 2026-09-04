import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  /** Optional parent category — omit or leave undefined for a top-level category. */
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

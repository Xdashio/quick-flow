import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  /** Pass a category id to (re)parent, null to move to top-level, or omit to leave unchanged. */
  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}

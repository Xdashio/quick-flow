import { IsString, IsOptional, MaxLength, Matches, IsIn } from 'class-validator';

export class PresignUploadDto {
  /** Original filename — used only to extract extension for Content-Type */
  @IsString()
  @MaxLength(255)
  @Matches(/\.(jpg|jpeg|png|webp|gif|avif)$/i, {
    message: 'filename must end with .jpg, .jpeg, .png, .webp, .gif, or .avif',
  })
  filename!: string;

  /**
   * Browser's file.type. When provided and allow-listed it is signed as the
   * PUT Content-Type so signature and upload headers match exactly.
   */
  @IsOptional()
  @IsString()
  @IsIn(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
  contentType?: string;
}
import { IsString, MaxLength, Matches } from 'class-validator';

export class PresignUploadDto {
  /** Original filename — used only to extract extension for Content-Type */
  @IsString()
  @MaxLength(255)
  @Matches(/\.(jpg|jpeg|png|webp|gif|avif)$/i, {
    message: 'filename must end with .jpg, .jpeg, .png, .webp, .gif, or .avif',
  })
  filename!: string;
}
import { IsString, IsUUID, IsInt, Min, Matches } from 'class-validator';

export class StkPushDto {
  @IsUUID()
  transactionId!: string;

  /**
   * Phone number in Kenyan format: 07XXXXXXXX, 01XXXXXXXX, 2547XXXXXXXX, 2541XXXXXXXX
   */
  @IsString()
  @Matches(/^(?:\+?254|0)?[71]\d{8}$/, {
    message: 'phoneNumber must be a valid Kenyan mobile number (e.g. 0712345678, 0112345678, or 254712345678)',
  })
  phoneNumber!: string;

  /** Amount in integer cents (e.g. 100 = KES 1.00) */
  @IsInt()
  @Min(1)
  amountCents!: number;
}

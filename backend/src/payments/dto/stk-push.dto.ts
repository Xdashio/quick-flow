import { IsString, IsUUID, IsInt, Min, Matches } from 'class-validator';

export class StkPushDto {
  @IsUUID()
  transactionId!: string;

  /**
   * Phone number in E.164 format without leading +
   * Safaricom sandbox test MSISDN: 254708374149
   */
  @IsString()
  @Matches(/^2547\d{8}$/, {
    message: 'phoneNumber must be a valid Kenyan M-Pesa number (format: 2547XXXXXXXX)',
  })
  phoneNumber!: string;

  /** Amount in integer cents (e.g. 100 = KES 1.00) */
  @IsInt()
  @Min(1)
  amountCents!: number;
}

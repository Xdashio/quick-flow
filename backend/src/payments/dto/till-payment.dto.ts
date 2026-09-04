import { IsString, IsUUID, IsInt, Min, Matches } from 'class-validator';

export class TillPaymentDto {
  @IsUUID()
  transactionId!: string;

  /**
   * M-Pesa transaction code entered manually by cashier
   * Safaricom format: 10–12 uppercase alphanumeric chars, e.g. QHN7ACKQOP
   */
  @IsString()
  @Matches(/^[A-Z0-9]{10,12}$/, {
    message: 'mpesaCode must be a valid M-Pesa transaction code (e.g. QHN7ACKQOP)',
  })
  mpesaCode!: string;

  /** Amount in integer cents */
  @IsInt()
  @Min(1)
  amountCents!: number;
}

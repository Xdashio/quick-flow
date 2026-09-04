import {
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  IsIn,
} from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  transactionId!: string;

  @IsString()
  @IsIn(['cash', 'mpesa_stk', 'mpesa_till', 'store_credit'])
  method!: string;

  @IsInt()
  @Min(0)
  amountCents!: number;

  @IsOptional()
  @IsString()
  mpesaReceiptNumber?: string;

  @IsOptional()
  @IsString()
  mpesaPhoneNumber?: string;

  @IsOptional()
  @IsString()
  checkoutRequestId?: string;

  @IsOptional()
  @IsString()
  etimsInvoiceNumber?: string;

  @IsOptional()
  @IsString()
  @IsIn(['pending', 'awaiting_confirmation', 'captured', 'failed', 'refunded'])
  status?: string;
}

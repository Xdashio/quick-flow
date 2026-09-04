import { IsString, IsOptional, IsUUID, IsInt, Min, IsIn } from 'class-validator';

export class CreateDrawerEventDto {
  @IsOptional()
  @IsUUID()
  registerId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsString()
  @IsIn(['sale', 'no_sale', 'manager_override', 'change'])
  reason!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  amountCents?: number;
}

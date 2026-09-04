import {
  IsString,
  IsIn,
  IsOptional,
  IsBoolean,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  name!: string;

  /**
   * Raw password/PIN (plain text). The service bcrypt-hashes it before storing
   * in the pin_hash column. Managers use a full password; cashiers use a short PIN.
   */
  @IsString()
  @MinLength(4)
  password!: string;

  @IsString()
  @IsIn(['cashier', 'manager', 'admin'])
  role!: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;

  @IsOptional()
  @IsString()
  @IsIn(['cashier', 'manager', 'admin'])
  role?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

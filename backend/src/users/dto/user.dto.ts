import {
  IsString,
  IsIn,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  name!: string;

  /**
   * Raw credential (plain text). The service bcrypt-hashes it before storing
   * in the pin_hash column. Role-differentiated policy is enforced in
   * UsersService: cashiers get a short numeric PIN, managers/admins a full
   * password — so this stays a plain string here.
   */
  @IsString()
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
  password?: string;

  @IsOptional()
  @IsString()
  @IsIn(['cashier', 'manager', 'admin'])
  role?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * PATCH /api/users/me — edit your own profile.
 * Renaming yourself or changing your own credential goes through here (never
 * through PATCH /:id, which is staff management). A credential change always
 * requires proving the current one.
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  currentPassword?: string;
}

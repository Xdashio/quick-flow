import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

export interface JwtPayload {
  sub: string;     // user UUID
  name: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Validates username (matched against name field, case-insensitive) and
   * password (bcrypt-checked against pin_hash column). Returns JWT on success.
   *
   * Manager/admin login uses full password, not short PIN.
   * The pin_hash column stores bcrypt of whatever credential the user has —
   * short PINs for cashiers, full passwords for managers.
   *
   * Returns 401 if:
   *   - User not found
   *   - Password incorrect
   *   - User is deactivated (active = false)
   */
  async login(username: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { name: { equals: username, mode: 'insensitive' } },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.active) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const valid = await bcrypt.compare(password, user.pinHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      name: user.name,
      role: user.role,
    };

    const token = this.jwt.sign(payload);
    return { accessToken: token, user: { id: user.id, name: user.name, role: user.role } };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true, active: true, createdAt: true },
    });
    if (!user || !user.active) {
      throw new UnauthorizedException('User not found or deactivated');
    }
    return user;
  }
}

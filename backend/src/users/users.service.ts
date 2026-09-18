import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, UpdateProfileDto } from './dto/user.dto';
import * as bcrypt from 'bcryptjs';

const SAFE_SELECT = {
  id: true,
  name: true,
  role: true,
  active: true,
  createdAt: true,
  // pin_hash intentionally omitted from all responses
};

/**
 * The authenticated caller, as attached to the request by JwtStrategy.
 * Every staff-management decision is derived from this — never trust a
 * role sent in the request body.
 */
export interface Actor {
  userId: string;
  name: string;
  role: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: SAFE_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: SAFE_SELECT,
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  /**
   * Credential policy, differentiated by role:
   * - cashier: short numeric PIN (4–6 digits) for the till keypad.
   * - manager / admin: full password — min 8 chars with both a letter and a
   *   digit, so a privileged password can never be a PIN-shaped value that
   *   works by accident on a numeric keypad.
   */
  private assertCredentialPolicy(role: string, password: string) {
    if (role === 'cashier') {
      if (!/^\d{4,6}$/.test(password)) {
        throw new BadRequestException(
          'Cashier credential must be a numeric PIN of 4–6 digits.',
        );
      }
      return;
    }
    if (password.length < 8) {
      throw new BadRequestException(
        'Manager/Admin password must be at least 8 characters.',
      );
    }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      throw new BadRequestException(
        'Manager/Admin password must contain both letters and numbers.',
      );
    }
  }

  private async assertNameUnique(name: string, exceptId?: string) {
    const existing = await this.prisma.user.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException(`A user named "${name}" already exists`);
    }
  }

  /** Guards against locking every admin out: the last active admin can
   * neither be deactivated nor be demoted to a lesser role. */
  private async assertNotLastAdmin(targetId: string, action: 'deactivate' | 'demote') {
    const activeAdmins = await this.prisma.user.count({
      where: { role: 'admin', active: true },
    });
    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    const targetCounts = target?.role === 'admin' && target?.active === true;
    if (targetCounts && activeAdmins <= 1) {
      throw new BadRequestException(
        `Cannot ${action} the last active admin — promote another admin first.`,
      );
    }
  }

  async create(dto: CreateUserDto, actor: Actor) {
    if (actor.role === 'cashier') {
      throw new ForbiddenException('Cashiers cannot manage staff accounts.');
    }
    if (actor.role === 'manager' && dto.role !== 'cashier') {
      throw new ForbiddenException('Managers can only create cashier accounts.');
    }

    this.assertCredentialPolicy(dto.role, dto.password);
    await this.assertNameUnique(dto.name);

    const pinHash = await bcrypt.hash(dto.password, 12);
    return this.prisma.user.create({
      data: {
        name: dto.name,
        pinHash,
        role: dto.role,
        active: true,
      },
      select: SAFE_SELECT,
    });
  }

  async update(id: string, dto: UpdateUserDto, actor: Actor) {
    const target = await this.findOne(id); // throws 404 if not found

    if (actor.role === 'cashier') {
      throw new ForbiddenException('Cashiers cannot manage staff accounts.');
    }
    if (id === actor.userId) {
      // Self-service (including password changes, which need the current
      // password as proof) lives at PATCH /users/me — never here, where the
      // actor could otherwise escalate their own role or reactivate themself.
      throw new ForbiddenException(
        'You cannot edit your own account here — use your profile instead.',
      );
    }
    if (actor.role === 'manager') {
      if (target.role !== 'cashier') {
        throw new ForbiddenException('Managers can only manage cashier accounts.');
      }
      if (dto.role !== undefined) {
        throw new ForbiddenException('Only admins can change user roles.');
      }
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) throw new BadRequestException('Name cannot be empty.');
      await this.assertNameUnique(name, id);
    }
    if (dto.password !== undefined) {
      this.assertCredentialPolicy(dto.role ?? target.role, dto.password);
    }
    if (target.role === 'admin') {
      if (dto.active === false) {
        await this.assertNotLastAdmin(id, 'deactivate');
      }
      if (dto.role !== undefined && dto.role !== 'admin') {
        await this.assertNotLastAdmin(id, 'demote');
      }
    }

    const data: Record<string, any> = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.active !== undefined) data.active = dto.active;
    if (dto.password !== undefined) {
      data.pinHash = await bcrypt.hash(dto.password, 12);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: SAFE_SELECT,
    });
  }

  /**
   * PATCH /api/users/me — edit your own display name and/or credential.
   * Changing the credential requires the current one as proof. Role and
   * active status can never be changed here.
   */
  async updateMe(actor: Actor, dto: UpdateProfileDto) {
    const me = await this.findOne(actor.userId);

    if (dto.name === undefined && dto.password === undefined) {
      throw new BadRequestException('Nothing to update.');
    }

    const data: Record<string, any> = {};

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) throw new BadRequestException('Name cannot be empty.');
      await this.assertNameUnique(name, me.id);
      data.name = name;
    }

    if (dto.password !== undefined) {
      if (!dto.currentPassword) {
        throw new BadRequestException(
          'Current password is required to set a new one.',
        );
      }
      const full = await this.prisma.user.findUnique({ where: { id: me.id } });
      const valid = full && (await bcrypt.compare(dto.currentPassword, full.pinHash));
      if (!valid) {
        throw new UnauthorizedException('Current password is incorrect.');
      }
      this.assertCredentialPolicy(me.role, dto.password);
      data.pinHash = await bcrypt.hash(dto.password, 12);
    }

    return this.prisma.user.update({
      where: { id: me.id },
      data,
      select: SAFE_SELECT,
    });
  }
}

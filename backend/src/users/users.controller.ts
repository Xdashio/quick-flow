import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Request,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService, Actor } from './users.service';
import { CreateUserDto, UpdateUserDto, UpdateProfileDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  /** GET /api/users — list all users (no pin_hash) */
  @Get()
  findAll() {
    return this.service.findAll();
  }

  /** GET /api/users/:id */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  /**
   * POST /api/users — create a new user
   * Body: { name, password, role }
   * Cashiers get a numeric PIN, managers/admins a full password (enforced).
   * Managers may only create cashiers; only admins may create managers/admins.
   */
  @Post()
  create(@Request() req: { user: Actor }, @Body() dto: CreateUserDto) {
    return this.service.create(dto, req.user);
  }

  /**
   * PATCH /api/users/me — edit your own profile (name and/or credential).
   * Credential changes require the current password as proof.
   * NOTE: declared before PATCH ':id' so "me" is never parsed as a UUID.
   */
  @Patch('me')
  updateMe(@Request() req: { user: Actor }, @Body() dto: UpdateProfileDto) {
    return this.service.updateMe(req.user, dto);
  }

  /**
   * PATCH /api/users/:id — staff management (name, role, active, credential).
   * Managers may only manage cashiers and cannot change roles; admins have
   * full access except the last-admin safeguard. Nobody can edit themself
   * here — that lives at PATCH /users/me.
   */
  @Patch(':id')
  update(
    @Request() req: { user: Actor },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.service.update(id, dto, req.user);
  }
}

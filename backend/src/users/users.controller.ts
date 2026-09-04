import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
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
   * Password is bcrypt-hashed before storage.
   */
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.service.create(dto);
  }

  /**
   * PATCH /api/users/:id — update user (name, role, active, password)
   * Setting active=false deactivates — subsequent logins return 401.
   */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.service.update(id, dto);
  }
}

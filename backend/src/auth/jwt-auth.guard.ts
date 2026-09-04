import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Use on any route that requires a valid JWT. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

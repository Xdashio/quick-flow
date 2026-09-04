import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { status: string; version: string } {
    return { status: 'ok', version: '0.1.0-phase0' };
  }

  health() {
    return {
      status: 'ok',
      version: '0.1.0-phase0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}

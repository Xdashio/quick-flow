import { Module } from '@nestjs/common';
import { PrinterService } from './printer.service';
import { HardwareController } from './hardware.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HardwareController],
  providers: [PrinterService],
  exports: [PrinterService],
})
export class HardwareModule {}

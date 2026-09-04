import { Module } from '@nestjs/common';
import { DrawerEventsService } from './drawer-events.service';
import { DrawerEventsController } from './drawer-events.controller';

@Module({
  controllers: [DrawerEventsController],
  providers: [DrawerEventsService],
  exports: [DrawerEventsService],
})
export class DrawerEventsModule {}

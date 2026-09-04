import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { DrawerEventsService } from './drawer-events.service';
import { CreateDrawerEventDto } from './dto/create-drawer-event.dto';

@Controller('drawer-events')
export class DrawerEventsController {
  constructor(private readonly service: DrawerEventsService) {}

  @Post()
  create(@Body() dto: CreateDrawerEventDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('limit') limit?: string, @Query('reason') reason?: string) {
    if (reason) return this.service.findByReason(reason);
    return this.service.findAll(limit ? parseInt(limit, 10) : 100);
  }
}

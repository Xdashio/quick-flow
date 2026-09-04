import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateMovementDto } from './dto/create-movement.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Post('movements')
  create(@Body() dto: CreateMovementDto) {
    return this.service.createMovement(dto);
  }

  @Get('current/:productId')
  getCurrent(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('locationId') locationId?: string,
  ) {
    if (locationId) {
      // validate UUID format loosely – let service handle not found
      return this.service.getCurrentStock(productId, locationId);
    }
    return this.service.getCurrentStock(productId);
  }

  @Get('movements')
  list(
    @Query('productId') productId?: string,
    @Query('locationId') locationId?: string,
  ) {
    return this.service.listMovements(productId, locationId);
  }

  /** Products with a reorder point set whose total stock has fallen at or below it. */
  @Get('low-stock')
  lowStock() {
    return this.service.getLowStock();
  }
}

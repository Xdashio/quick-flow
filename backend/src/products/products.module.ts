import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ImagesModule } from '../images/images.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [ImagesModule, InventoryModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
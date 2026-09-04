import { Module } from '@nestjs/common';
import { TaxCategoriesService } from './tax-categories.service';
import { TaxCategoriesController } from './tax-categories.controller';

@Module({
  controllers: [TaxCategoriesController],
  providers: [TaxCategoriesService],
  exports: [TaxCategoriesService],
})
export class TaxCategoriesModule {}

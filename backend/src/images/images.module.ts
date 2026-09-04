import { Module } from '@nestjs/common';
import { R2Service } from './r2.service';
import { ImagesController } from './images.controller';

@Module({
  providers: [R2Service],
  controllers: [ImagesController],
  exports: [R2Service],
})
export class ImagesModule {}
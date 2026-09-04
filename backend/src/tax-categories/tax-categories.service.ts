import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaxCategoryDto } from './dto/create-tax-category.dto';
import { UpdateTaxCategoryDto } from './dto/update-tax-category.dto';

@Injectable()
export class TaxCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTaxCategoryDto) {
    return this.prisma.taxCategory.create({
      data: { name: dto.name, rateBp: dto.rateBp },
    });
  }

  async findAll() {
    return this.prisma.taxCategory.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const tc = await this.prisma.taxCategory.findUnique({ where: { id } });
    if (!tc) throw new NotFoundException(`TaxCategory ${id} not found`);
    return tc;
  }

  async update(id: string, dto: UpdateTaxCategoryDto) {
    await this.findOne(id);
    return this.prisma.taxCategory.update({
      where: { id },
      data: { name: dto.name, rateBp: dto.rateBp },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.taxCategory.delete({ where: { id } });
    return { deleted: true, id };
  }
}

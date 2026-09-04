import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    try {
      const product = await this.prisma.product.create({
        data: {
          sku: dto.sku,
          barcode: dto.barcode ?? null,
          name: dto.name,
          description: dto.description ?? null,
          unitType: dto.unitType ?? 'each',
          isWeighed: dto.isWeighed ?? false,
          priceCents: dto.priceCents,
          taxCategoryId: dto.taxCategoryId ?? null,
          categoryId: dto.categoryId ?? null,
          active: dto.active ?? true,
        },
        include: { taxCategory: true, category: true },
      });
      return product;
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException(`SKU already exists: ${dto.sku}`);
      }
      throw e;
    }
  }

  async findAll() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { taxCategory: true, category: true },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { taxCategory: true, category: true },
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async findByBarcode(barcode: string) {
    const product = await this.prisma.product.findFirst({
      where: { barcode },
      include: { taxCategory: true, category: true },
    });
    if (!product)
      throw new NotFoundException(`Product with barcode ${barcode} not found`);
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: {
          sku: dto.sku,
          barcode: dto.barcode,
          name: dto.name,
          description: dto.description,
          unitType: dto.unitType,
          isWeighed: dto.isWeighed,
          priceCents: dto.priceCents,
          taxCategoryId: dto.taxCategoryId,
          categoryId: dto.categoryId,
          active: dto.active,
        },
        include: { taxCategory: true, category: true },
      });
      return product;
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException(`SKU already exists: ${dto.sku}`);
      }
      throw e;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      await this.prisma.product.delete({ where: { id } });
      return { deleted: true, id };
    } catch (e: any) {
      if (e.code === 'P2003' || e.code === 'P2002' || e.code === 'P2003') {
        // Foreign key constraint – soft delete
        const product = await this.prisma.product.update({
          where: { id },
          data: { active: false },
        });
        return { deleted: false, deactivated: true, product };
      }
      throw e;
    }
  }
}

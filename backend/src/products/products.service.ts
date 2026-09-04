import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { R2Service } from '../images/r2.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private r2: R2Service,
  ) {}

  /** Append a resolved imageUrl to any product row */
  private withImageUrl<T extends { imageKey?: string | null }>(product: T) {
    return {
      ...product,
      imageUrl: this.r2.publicUrlFor(product.imageKey),
    };
  }

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
          imageKey: dto.imageKey ?? null,
        },
        include: { taxCategory: true, category: true },
      });
      return this.withImageUrl(product);
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException(`SKU already exists: ${dto.sku}`);
      }
      throw e;
    }
  }

  async findAll() {
    const products = await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { taxCategory: true, category: true },
    });
    return products.map((p) => this.withImageUrl(p));
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { taxCategory: true, category: true },
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return this.withImageUrl(product);
  }

  async findByBarcode(barcode: string) {
    const product = await this.prisma.product.findFirst({
      where: { barcode },
      include: { taxCategory: true, category: true },
    });
    if (!product)
      throw new NotFoundException(`Product with barcode ${barcode} not found`);
    return this.withImageUrl(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.findOne(id);

    // If imageKey is being replaced and the old one differs, clean up R2
    if (
      dto.imageKey !== undefined &&
      existing.imageKey &&
      existing.imageKey !== dto.imageKey
    ) {
      await this.r2.deleteObject(existing.imageKey);
    }

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
          imageKey: dto.imageKey,
        },
        include: { taxCategory: true, category: true },
      });
      return this.withImageUrl(product);
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException(`SKU already exists: ${dto.sku}`);
      }
      throw e;
    }
  }

  async remove(id: string) {
    const existing = await this.findOne(id);

    // Clean up image from R2 before deleting the product row
    if (existing.imageKey) {
      await this.r2.deleteObject(existing.imageKey);
    }

    try {
      await this.prisma.product.delete({ where: { id } });
      return { deleted: true, id };
    } catch (e: any) {
      if (e.code === 'P2003' || e.code === 'P2002') {
        // Foreign key constraint — soft delete (keep image since product still exists)
        const product = await this.prisma.product.update({
          where: { id },
          data: { active: false },
        });
        return { deleted: false, deactivated: true, product: this.withImageUrl(product) };
      }
      throw e;
    }
  }
}
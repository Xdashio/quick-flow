import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { R2Service } from '../images/r2.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private r2: R2Service,
    private inventory: InventoryService,
  ) {}

  /** Append a resolved imageUrl, plus profit figures when cost is known. */
  private withComputed<
    T extends { imageKey?: string | null; priceCents: number; costCents?: number | null },
  >(product: T) {
    const hasCost = product.costCents !== null && product.costCents !== undefined;
    const profitCents = hasCost ? product.priceCents - (product.costCents as number) : null;
    const marginPct =
      hasCost && product.priceCents > 0
        ? Math.round((profitCents! / product.priceCents) * 1000) / 10
        : null;
    return {
      ...product,
      imageUrl: this.r2.publicUrlFor(product.imageKey),
      profitCents,
      marginPct,
    };
  }

  async create(dto: CreateProductDto) {
    if (dto.initialStock && dto.initialStock > 0 && !dto.initialLocationId) {
      throw new BadRequestException(
        'initialLocationId is required when initialStock is provided',
      );
    }

    try {
      const createdProduct = await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            sku: dto.sku,
            barcode: dto.barcode ?? null,
            name: dto.name,
            description: dto.description ?? null,
            unitType: dto.unitType ?? 'each',
            isWeighed: dto.isWeighed ?? false,
            priceCents: dto.priceCents,
            costCents: dto.costCents ?? null,
            taxCategoryId: dto.taxCategoryId ?? null,
            categoryId: dto.categoryId ?? null,
            active: dto.active ?? true,
            imageKey: dto.imageKey ?? null,
            reorderPoint: dto.reorderPoint ?? null,
          },
          include: { taxCategory: true, category: true },
        });

        if (dto.initialStock && dto.initialStock > 0) {
          await this.inventory.recordInitialStock(
            product.id,
            dto.initialLocationId!,
            dto.initialStock,
            undefined,
            tx,
          );
        }

        return product;
      });

      if (dto.initialStock && dto.initialStock > 0) {
        await this.inventory.refreshMaterializedView();
      }

      return this.withComputed({
        ...createdProduct,
        totalStock: dto.initialStock ?? 0,
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException(`SKU already exists: ${dto.sku}`);
      }
      throw e;
    }
  }

  async findAll() {
    const [products, stockMap] = await Promise.all([
      this.prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        include: { taxCategory: true, category: true },
      }),
      this.inventory.getTotalStockMap(),
    ]);

    return products.map((p) =>
      this.withComputed({
        ...p,
        totalStock: stockMap.get(p.id) ?? 0,
      }),
    );
  }

  async findOne(id: string) {
    const [product, stockMap] = await Promise.all([
      this.prisma.product.findUnique({
        where: { id },
        include: { taxCategory: true, category: true },
      }),
      this.inventory.getTotalStockMap([id]),
    ]);
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return this.withComputed({
      ...product,
      totalStock: stockMap.get(product.id) ?? 0,
    });
  }

  async findByBarcode(barcode: string) {
    const product = await this.prisma.product.findFirst({
      where: { barcode },
      include: { taxCategory: true, category: true },
    });
    if (!product)
      throw new NotFoundException(`Product with barcode ${barcode} not found`);
    const stockMap = await this.inventory.getTotalStockMap([product.id]);
    return this.withComputed({
      ...product,
      totalStock: stockMap.get(product.id) ?? 0,
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, imageKey: true },
    });
    if (!existing) {
      throw new NotFoundException(`Product ${id} not found`);
    }

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
          costCents: dto.costCents,
          taxCategoryId: dto.taxCategoryId,
          categoryId: dto.categoryId,
          active: dto.active,
          imageKey: dto.imageKey,
          reorderPoint: dto.reorderPoint,
        },
        include: { taxCategory: true, category: true },
      });
      const stockMap = await this.inventory.getTotalStockMap([id]);
      return this.withComputed({
        ...product,
        totalStock: stockMap.get(id) ?? 0,
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException(`SKU already exists: ${dto.sku}`);
      }
      throw e;
    }
  }

  async remove(id: string) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, imageKey: true },
    });
    if (!existing) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    try {
      await this.prisma.product.delete({ where: { id } });
      // Only clean up image from R2 once the product row has been permanently deleted
      if (existing.imageKey) {
        await this.r2.deleteObject(existing.imageKey);
      }
      return { deleted: true, id };
    } catch (e: any) {
      if (e.code === 'P2003' || e.code === 'P2002') {
        // Foreign key constraint — soft delete (keep image since product still exists)
        const product = await this.prisma.product.update({
          where: { id },
          data: { active: false },
        });
        return { deleted: false, deactivated: true, product: this.withComputed(product) };
      }
      throw e;
    }
  }
}
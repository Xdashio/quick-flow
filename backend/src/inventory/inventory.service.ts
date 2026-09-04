import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async createMovement(dto: CreateMovementDto) {
    // Validate FKs
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product)
      throw new NotFoundException(`Product ${dto.productId} not found`);
    const location = await this.prisma.location.findUnique({
      where: { id: dto.locationId },
    });
    if (!location)
      throw new NotFoundException(`Location ${dto.locationId} not found`);
    if (dto.createdBy) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.createdBy },
      });
      if (!user)
        throw new NotFoundException(`User ${dto.createdBy} not found`);
    }

    const movement = await this.prisma.inventoryMovement.create({
      data: {
        productId: dto.productId,
        locationId: dto.locationId,
        quantityDelta: dto.quantityDelta,
        reason: dto.reason,
        referenceId: dto.referenceId ?? null,
        createdBy: dto.createdBy ?? null,
      },
    });

    // Recalculate current stock – refresh materialized view
    // Use CONCURRENTLY if possible (requires unique index, which we have)
    try {
      await this.prisma.$executeRawUnsafe(
        'REFRESH MATERIALIZED VIEW CONCURRENTLY current_inventory',
      );
    } catch (e) {
      // Fallback to non-concurrent refresh if concurrently fails (e.g., no unique index yet)
      await this.prisma.$executeRawUnsafe(
        'REFRESH MATERIALIZED VIEW current_inventory',
      );
    }

    // Fetch current stock for this product/location from the view
    const current = await this.getCurrentStock(dto.productId, dto.locationId);

    return { movement, currentStock: current };
  }

  async getCurrentStock(productId: string, locationId?: string) {
    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product)
      throw new NotFoundException(`Product ${productId} not found`);

    if (locationId) {
      const rows = (await this.prisma.$queryRawUnsafe(
        'SELECT product_id, location_id, quantity FROM current_inventory WHERE product_id = $1::uuid AND location_id = $2::uuid',
        productId,
        locationId,
      )) as Array<{ product_id: string; location_id: string; quantity: string }>;
      if (rows.length === 0) {
        return { productId, locationId, quantity: '0.000' };
      }
      return {
        productId: rows[0].product_id,
        locationId: rows[0].location_id,
        quantity: rows[0].quantity,
      };
    } else {
      const rows = (await this.prisma.$queryRawUnsafe(
        'SELECT product_id, location_id, quantity FROM current_inventory WHERE product_id = $1::uuid',
        productId,
      )) as Array<{ product_id: string; location_id: string; quantity: string }>;
      // Also include fallback aggregate if view is empty but movements exist (e.g., view not refreshed)
      if (rows.length === 0) {
        const agg = await this.prisma.inventoryMovement.aggregate({
          _sum: { quantityDelta: true },
          where: { productId },
        });
        const qty = agg._sum.quantityDelta?.toString() ?? '0';
        return [{ productId, locationId: null, quantity: qty }];
      }
      return rows.map((r) => ({
        productId: r.product_id,
        locationId: r.location_id,
        quantity: r.quantity,
      }));
    }
  }

  /**
   * Products with a reorder point set whose total stock (summed across all
   * locations, from the movement ledger directly so it's always current)
   * has fallen at or below that threshold. Sorted lowest stock first.
   */
  async getLowStock() {
    const trackedProducts = await this.prisma.product.findMany({
      where: { reorderPoint: { not: null }, active: true },
      select: { id: true, sku: true, name: true, unitType: true, reorderPoint: true },
    });
    if (trackedProducts.length === 0) return [];

    const productIds = trackedProducts.map((p) => p.id);
    const totals = await this.prisma.inventoryMovement.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds } },
      _sum: { quantityDelta: true },
    });
    const totalsMap = new Map(
      totals.map((t) => [t.productId, Number(t._sum.quantityDelta ?? 0)]),
    );

    return trackedProducts
      .map((p) => ({
        productId: p.id,
        sku: p.sku,
        name: p.name,
        unitType: p.unitType,
        reorderPoint: p.reorderPoint as number,
        currentStock: totalsMap.get(p.id) ?? 0,
      }))
      .filter((p) => p.currentStock <= p.reorderPoint)
      .sort((a, b) => a.currentStock - b.currentStock);
  }

  async listMovements(productId?: string, locationId?: string) {
    const where: any = {};
    if (productId) where.productId = productId;
    if (locationId) where.locationId = locationId;
    return this.prisma.inventoryMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}

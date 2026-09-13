import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { ProductStockDetailDto } from './dto/product-stock-detail.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

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
    await this.refreshMaterializedView();

    // Fetch current stock for this product/location from the view
    const current = await this.getCurrentStock(dto.productId, dto.locationId);

    return { movement, currentStock: current };
  }

  async refreshMaterializedView() {
    try {
      await this.prisma.$executeRawUnsafe(
        'REFRESH MATERIALIZED VIEW CONCURRENTLY current_inventory',
      );
    } catch {
      try {
        await this.prisma.$executeRawUnsafe(
          'REFRESH MATERIALIZED VIEW current_inventory',
        );
      } catch (err) {
        this.logger.warn(
          `Failed to refresh current_inventory materialized view: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
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

  /**
   * Bulk aggregation of total stock across all locations per product.
   * Runs in O(1) database trips via current_inventory materialized view,
   * with fallback to inventory_movements ledger.
   */
  async getTotalStockMap(productIds?: string[]): Promise<Map<string, number>> {
    let stockRows: Array<{ product_id: string; total_stock: string }> = [];
    try {
      if (productIds && productIds.length > 0) {
        stockRows = await this.prisma.$queryRawUnsafe<
          Array<{ product_id: string; total_stock: string }>
        >(
          'SELECT product_id, COALESCE(SUM(quantity), 0) AS total_stock FROM current_inventory WHERE product_id = ANY($1::uuid[]) GROUP BY product_id',
          productIds,
        );
      } else {
        stockRows = await this.prisma.$queryRawUnsafe<
          Array<{ product_id: string; total_stock: string }>
        >(
          'SELECT product_id, COALESCE(SUM(quantity), 0) AS total_stock FROM current_inventory GROUP BY product_id',
        );
      }
    } catch {
      // Fallback directly to ledger if view is not accessible or refreshed
      const fallback = await this.prisma.inventoryMovement.groupBy({
        by: ['productId'],
        where: productIds && productIds.length > 0 ? { productId: { in: productIds } } : undefined,
        _sum: { quantityDelta: true },
      });
      stockRows = fallback.map((f) => ({
        product_id: f.productId,
        total_stock: f._sum.quantityDelta?.toString() ?? '0',
      }));
    }

    const map = new Map<string, number>();
    for (const r of stockRows) {
      map.set(r.product_id, Math.round((parseFloat(r.total_stock) || 0) * 1000) / 1000);
    }

    if (productIds && productIds.length > 0) {
      const missingIds = productIds.filter((id) => !map.has(id));
      if (missingIds.length > 0) {
        const fallback = await this.prisma.inventoryMovement.groupBy({
          by: ['productId'],
          where: { productId: { in: missingIds } },
          _sum: { quantityDelta: true },
        });
        for (const f of fallback) {
          const qty = f._sum.quantityDelta
            ? Math.round(Number(f._sum.quantityDelta) * 1000) / 1000
            : 0;
          map.set(f.productId, qty);
        }
      }
    }

    return map;
  }

  /**
   * Full inventory breakdown for a specific product across all active store locations.
   * Ensures locations with zero stock are explicitly included.
   */
  async getProductStockDetails(productId: string): Promise<ProductStockDetailDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    const locations = await this.prisma.location.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });

    let currentRows: Array<{ location_id: string; quantity: string }> = [];
    try {
      currentRows = await this.prisma.$queryRawUnsafe<
        Array<{ location_id: string; quantity: string }>
      >(
        'SELECT location_id, quantity FROM current_inventory WHERE product_id = $1::uuid',
        productId,
      );
    } catch {
      // Handled by ledger fallback below
    }

    if (currentRows.length === 0) {
      const fallback = await this.prisma.inventoryMovement.groupBy({
        by: ['locationId'],
        where: { productId },
        _sum: { quantityDelta: true },
      });
      currentRows = fallback.map((f) => ({
        location_id: f.locationId,
        quantity: f._sum.quantityDelta?.toString() ?? '0',
      }));
    }

    const qtyMap = new Map<string, number>();
    for (const r of currentRows) {
      qtyMap.set(r.location_id, parseFloat(r.quantity) || 0);
    }

    let totalStock = 0;
    const locationStock = locations.map((loc) => {
      const qty = qtyMap.get(loc.id) ?? 0;
      totalStock += qty;
      return {
        locationId: loc.id,
        locationName: loc.name,
        quantity: Math.round(qty * 1000) / 1000,
      };
    });

    return {
      productId,
      totalStock: Math.round(totalStock * 1000) / 1000,
      locations: locationStock,
    };
  }

  /**
   * Records initial stock receiving movement within an optional caller transaction client.
   */
  async recordInitialStock(
    productId: string,
    locationId: string,
    quantity: number,
    createdBy?: string,
    tx?: Prisma.TransactionClient | PrismaService,
  ) {
    const prismaClient = tx ?? this.prisma;
    const location = await prismaClient.location.findUnique({
      where: { id: locationId },
    });
    if (!location) {
      throw new NotFoundException(`Location ${locationId} not found`);
    }

    return prismaClient.inventoryMovement.create({
      data: {
        productId,
        locationId,
        quantityDelta: quantity,
        reason: 'receiving',
        createdBy: createdBy ?? null,
      },
    });
  }
}

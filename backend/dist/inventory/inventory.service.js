"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var InventoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InventoryService = InventoryService_1 = class InventoryService {
    prisma;
    logger = new common_1.Logger(InventoryService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createMovement(dto) {
        const product = await this.prisma.product.findUnique({
            where: { id: dto.productId },
        });
        if (!product)
            throw new common_1.NotFoundException(`Product ${dto.productId} not found`);
        const location = await this.prisma.location.findUnique({
            where: { id: dto.locationId },
        });
        if (!location)
            throw new common_1.NotFoundException(`Location ${dto.locationId} not found`);
        if (dto.createdBy) {
            const user = await this.prisma.user.findUnique({
                where: { id: dto.createdBy },
            });
            if (!user)
                throw new common_1.NotFoundException(`User ${dto.createdBy} not found`);
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
        await this.refreshMaterializedView();
        const current = await this.getCurrentStock(dto.productId, dto.locationId);
        return { movement, currentStock: current };
    }
    async refreshMaterializedView() {
        try {
            await this.prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW CONCURRENTLY current_inventory');
        }
        catch {
            try {
                await this.prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW current_inventory');
            }
            catch (err) {
                this.logger.warn(`Failed to refresh current_inventory materialized view: ${err instanceof Error ? err.message : err}`);
            }
        }
    }
    async getCurrentStock(productId, locationId) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product)
            throw new common_1.NotFoundException(`Product ${productId} not found`);
        if (locationId) {
            const rows = (await this.prisma.$queryRawUnsafe('SELECT product_id, location_id, quantity FROM current_inventory WHERE product_id = $1::uuid AND location_id = $2::uuid', productId, locationId));
            if (rows.length === 0) {
                return { productId, locationId, quantity: '0.000' };
            }
            return {
                productId: rows[0].product_id,
                locationId: rows[0].location_id,
                quantity: rows[0].quantity,
            };
        }
        else {
            const rows = (await this.prisma.$queryRawUnsafe('SELECT product_id, location_id, quantity FROM current_inventory WHERE product_id = $1::uuid', productId));
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
    async getLowStock() {
        const trackedProducts = await this.prisma.product.findMany({
            where: { reorderPoint: { not: null }, active: true },
            select: { id: true, sku: true, name: true, unitType: true, reorderPoint: true },
        });
        if (trackedProducts.length === 0)
            return [];
        const productIds = trackedProducts.map((p) => p.id);
        const totals = await this.prisma.inventoryMovement.groupBy({
            by: ['productId'],
            where: { productId: { in: productIds } },
            _sum: { quantityDelta: true },
        });
        const totalsMap = new Map(totals.map((t) => [t.productId, Number(t._sum.quantityDelta ?? 0)]));
        return trackedProducts
            .map((p) => ({
            productId: p.id,
            sku: p.sku,
            name: p.name,
            unitType: p.unitType,
            reorderPoint: p.reorderPoint,
            currentStock: totalsMap.get(p.id) ?? 0,
        }))
            .filter((p) => p.currentStock <= p.reorderPoint)
            .sort((a, b) => a.currentStock - b.currentStock);
    }
    async listMovements(productId, locationId) {
        const where = {};
        if (productId)
            where.productId = productId;
        if (locationId)
            where.locationId = locationId;
        return this.prisma.inventoryMovement.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }
    async getTotalStockMap(productIds) {
        let stockRows = [];
        try {
            if (productIds && productIds.length > 0) {
                stockRows = await this.prisma.$queryRawUnsafe('SELECT product_id, COALESCE(SUM(quantity), 0) AS total_stock FROM current_inventory WHERE product_id = ANY($1::uuid[]) GROUP BY product_id', productIds);
            }
            else {
                stockRows = await this.prisma.$queryRawUnsafe('SELECT product_id, COALESCE(SUM(quantity), 0) AS total_stock FROM current_inventory GROUP BY product_id');
            }
        }
        catch {
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
        const map = new Map();
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
    async getProductStockDetails(productId) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
            select: { id: true },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Product ${productId} not found`);
        }
        const locations = await this.prisma.location.findMany({
            orderBy: { name: 'asc' },
            select: { id: true, name: true },
        });
        let currentRows = [];
        try {
            currentRows = await this.prisma.$queryRawUnsafe('SELECT location_id, quantity FROM current_inventory WHERE product_id = $1::uuid', productId);
        }
        catch {
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
        const qtyMap = new Map();
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
    async recordInitialStock(productId, locationId, quantity, createdBy, tx) {
        const prismaClient = tx ?? this.prisma;
        const location = await prismaClient.location.findUnique({
            where: { id: locationId },
        });
        if (!location) {
            throw new common_1.NotFoundException(`Location ${locationId} not found`);
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
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = InventoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map
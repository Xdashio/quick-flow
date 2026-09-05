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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InventoryService = class InventoryService {
    prisma;
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
        try {
            await this.prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW CONCURRENTLY current_inventory');
        }
        catch (e) {
            await this.prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW current_inventory');
        }
        const current = await this.getCurrentStock(dto.productId, dto.locationId);
        return { movement, currentStock: current };
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
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map
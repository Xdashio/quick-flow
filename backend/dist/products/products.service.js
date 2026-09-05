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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const r2_service_1 = require("../images/r2.service");
let ProductsService = class ProductsService {
    prisma;
    r2;
    constructor(prisma, r2) {
        this.prisma = prisma;
        this.r2 = r2;
    }
    withComputed(product) {
        const hasCost = product.costCents !== null && product.costCents !== undefined;
        const profitCents = hasCost ? product.priceCents - product.costCents : null;
        const marginPct = hasCost && product.priceCents > 0
            ? Math.round((profitCents / product.priceCents) * 1000) / 10
            : null;
        return {
            ...product,
            imageUrl: this.r2.publicUrlFor(product.imageKey),
            profitCents,
            marginPct,
        };
    }
    async create(dto) {
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
                    costCents: dto.costCents ?? null,
                    taxCategoryId: dto.taxCategoryId ?? null,
                    categoryId: dto.categoryId ?? null,
                    active: dto.active ?? true,
                    imageKey: dto.imageKey ?? null,
                    reorderPoint: dto.reorderPoint ?? null,
                },
                include: { taxCategory: true, category: true },
            });
            return this.withComputed(product);
        }
        catch (e) {
            if (e.code === 'P2002') {
                throw new common_1.ConflictException(`SKU already exists: ${dto.sku}`);
            }
            throw e;
        }
    }
    async findAll() {
        const products = await this.prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
            include: { taxCategory: true, category: true },
        });
        return products.map((p) => this.withComputed(p));
    }
    async findOne(id) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: { taxCategory: true, category: true },
        });
        if (!product)
            throw new common_1.NotFoundException(`Product ${id} not found`);
        return this.withComputed(product);
    }
    async findByBarcode(barcode) {
        const product = await this.prisma.product.findFirst({
            where: { barcode },
            include: { taxCategory: true, category: true },
        });
        if (!product)
            throw new common_1.NotFoundException(`Product with barcode ${barcode} not found`);
        return this.withComputed(product);
    }
    async update(id, dto) {
        const existing = await this.findOne(id);
        if (dto.imageKey !== undefined &&
            existing.imageKey &&
            existing.imageKey !== dto.imageKey) {
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
            return this.withComputed(product);
        }
        catch (e) {
            if (e.code === 'P2002') {
                throw new common_1.ConflictException(`SKU already exists: ${dto.sku}`);
            }
            throw e;
        }
    }
    async remove(id) {
        const existing = await this.findOne(id);
        if (existing.imageKey) {
            await this.r2.deleteObject(existing.imageKey);
        }
        try {
            await this.prisma.product.delete({ where: { id } });
            return { deleted: true, id };
        }
        catch (e) {
            if (e.code === 'P2003' || e.code === 'P2002') {
                const product = await this.prisma.product.update({
                    where: { id },
                    data: { active: false },
                });
                return { deleted: false, deactivated: true, product: this.withComputed(product) };
            }
            throw e;
        }
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        r2_service_1.R2Service])
], ProductsService);
//# sourceMappingURL=products.service.js.map
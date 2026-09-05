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
exports.TaxCategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TaxCategoriesService = class TaxCategoriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        return this.prisma.taxCategory.create({
            data: { name: dto.name, rateBp: dto.rateBp },
        });
    }
    async findAll() {
        return this.prisma.taxCategory.findMany({ orderBy: { name: 'asc' } });
    }
    async findOne(id) {
        const tc = await this.prisma.taxCategory.findUnique({ where: { id } });
        if (!tc)
            throw new common_1.NotFoundException(`TaxCategory ${id} not found`);
        return tc;
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.taxCategory.update({
            where: { id },
            data: { name: dto.name, rateBp: dto.rateBp },
        });
    }
    async remove(id) {
        await this.findOne(id);
        await this.prisma.taxCategory.delete({ where: { id } });
        return { deleted: true, id };
    }
    async calculateTax(dto) {
        let subtotalCents = 0;
        let taxCents = 0;
        const lineResults = [];
        const taxGroupMap = new Map();
        for (const item of dto.lineItems) {
            const product = await this.prisma.product.findUnique({
                where: { id: item.productId },
                include: { taxCategory: true },
            });
            if (!product) {
                throw new common_1.NotFoundException(`Product ${item.productId} not found`);
            }
            const unitPriceCents = item.unitPriceCents ?? product.priceCents;
            const discountCents = item.discountCents ?? 0;
            const quantity = Number(item.quantity);
            const taxCategory = product.taxCategory;
            const taxRateBp = taxCategory?.rateBp ?? 0;
            const categoryName = taxCategory?.name ?? 'exempt';
            const lineSubtotalCents = Math.round(unitPriceCents * quantity) - discountCents;
            const lineTaxCents = Math.round((lineSubtotalCents * taxRateBp) / 10000);
            const lineTotalCents = lineSubtotalCents + lineTaxCents;
            subtotalCents += lineSubtotalCents;
            taxCents += lineTaxCents;
            lineResults.push({
                productId: product.id,
                productName: product.name,
                taxCategoryId: taxCategory?.id ?? null,
                taxCategoryName: categoryName,
                taxRateBp,
                quantity,
                unitPriceCents,
                discountCents,
                lineSubtotalCents,
                lineTaxCents,
                lineTotalCents,
            });
            const groupKey = taxCategory?.id ?? `rate-${taxRateBp}`;
            const existingGroup = taxGroupMap.get(groupKey);
            if (existingGroup) {
                existingGroup.taxableAmountCents += lineSubtotalCents;
                existingGroup.taxCents += lineTaxCents;
            }
            else {
                taxGroupMap.set(groupKey, {
                    taxCategoryId: taxCategory?.id ?? null,
                    name: categoryName,
                    rateBp: taxRateBp,
                    taxableAmountCents: lineSubtotalCents,
                    taxCents: lineTaxCents,
                });
            }
        }
        return {
            subtotalCents,
            taxCents,
            totalCents: subtotalCents + taxCents,
            lineItems: lineResults,
            taxGroups: Array.from(taxGroupMap.values()),
        };
    }
    async seedStandardCategories() {
        const categories = [
            { name: 'standard', rateBp: 1600 },
            { name: 'zero-rated', rateBp: 0 },
            { name: 'exempt', rateBp: 0 },
        ];
        const results = [];
        for (const cat of categories) {
            const existing = await this.prisma.taxCategory.findFirst({
                where: { name: cat.name },
            });
            if (existing) {
                results.push(existing);
            }
            else {
                const created = await this.prisma.taxCategory.create({
                    data: cat,
                });
                results.push(created);
            }
        }
        return results;
    }
};
exports.TaxCategoriesService = TaxCategoriesService;
exports.TaxCategoriesService = TaxCategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TaxCategoriesService);
//# sourceMappingURL=tax-categories.service.js.map
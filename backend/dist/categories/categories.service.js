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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CategoriesService = class CategoriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        if (dto.parentId) {
            await this.findOne(dto.parentId);
        }
        return this.prisma.productCategory.create({
            data: { name: dto.name, parentId: dto.parentId ?? null },
        });
    }
    async findAll() {
        const categories = await this.prisma.productCategory.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: { select: { products: true } },
            },
        });
        const childCounts = new Map();
        for (const c of categories) {
            if (c.parentId) {
                childCounts.set(c.parentId, (childCounts.get(c.parentId) ?? 0) + 1);
            }
        }
        return categories.map((c) => ({
            id: c.id,
            name: c.name,
            parentId: c.parentId,
            productCount: c._count.products,
            childCount: childCounts.get(c.id) ?? 0,
        }));
    }
    async findOne(id) {
        const category = await this.prisma.productCategory.findUnique({ where: { id } });
        if (!category)
            throw new common_1.NotFoundException(`Category ${id} not found`);
        return category;
    }
    async update(id, dto) {
        await this.findOne(id);
        if (dto.parentId !== undefined && dto.parentId !== null) {
            if (dto.parentId === id) {
                throw new common_1.BadRequestException('A category cannot be its own parent');
            }
            await this.assertNotDescendant(id, dto.parentId);
        }
        return this.prisma.productCategory.update({
            where: { id },
            data: {
                name: dto.name,
                ...(dto.parentId !== undefined ? { parentId: dto.parentId } : {}),
            },
        });
    }
    async remove(id) {
        await this.findOne(id);
        const childCount = await this.prisma.productCategory.count({ where: { parentId: id } });
        if (childCount > 0) {
            throw new common_1.ConflictException(`Cannot delete category with ${childCount} subcategor${childCount === 1 ? 'y' : 'ies'} — move or delete them first`);
        }
        await this.prisma.product.updateMany({
            where: { categoryId: id },
            data: { categoryId: null },
        });
        await this.prisma.productCategory.delete({ where: { id } });
        return { deleted: true, id };
    }
    async assertNotDescendant(categoryId, candidateParentId) {
        let current = candidateParentId;
        const seen = new Set();
        while (current) {
            if (current === categoryId) {
                throw new common_1.BadRequestException('Cannot move a category under its own descendant');
            }
            if (seen.has(current))
                break;
            seen.add(current);
            const parent = await this.prisma.productCategory.findUnique({
                where: { id: current },
                select: { parentId: true },
            });
            current = parent?.parentId ?? null;
        }
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map
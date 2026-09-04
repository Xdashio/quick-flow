import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    if (dto.parentId) {
      await this.findOne(dto.parentId);
    }
    return this.prisma.productCategory.create({
      data: { name: dto.name, parentId: dto.parentId ?? null },
    });
  }

  /** Flat list, ordered by name, with each category's product count and child count. */
  async findAll() {
    const categories = await this.prisma.productCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });

    // Children count needs a separate pass since Prisma has no self-relation back-ref here.
    const childCounts = new Map<string, number>();
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

  async findOne(id: string) {
    const category = await this.prisma.productCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);

    if (dto.parentId !== undefined && dto.parentId !== null) {
      if (dto.parentId === id) {
        throw new BadRequestException('A category cannot be its own parent');
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

  async remove(id: string) {
    await this.findOne(id);

    const childCount = await this.prisma.productCategory.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new ConflictException(
        `Cannot delete category with ${childCount} subcategor${childCount === 1 ? 'y' : 'ies'} — move or delete them first`,
      );
    }

    // Products keep existing but lose their category assignment.
    await this.prisma.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    await this.prisma.productCategory.delete({ where: { id } });
    return { deleted: true, id };
  }

  /** Prevents re-parenting a category under one of its own descendants (would create a cycle). */
  private async assertNotDescendant(categoryId: string, candidateParentId: string) {
    let current: string | null = candidateParentId;
    const seen = new Set<string>();

    while (current) {
      if (current === categoryId) {
        throw new BadRequestException('Cannot move a category under its own descendant');
      }
      if (seen.has(current)) break; // safety net against pre-existing bad data
      seen.add(current);

      const parent: { parentId: string | null } | null =
        await this.prisma.productCategory.findUnique({
          where: { id: current },
          select: { parentId: true },
        });
      current = parent?.parentId ?? null;
    }
  }
}

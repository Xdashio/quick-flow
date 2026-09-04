import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaxCategoryDto } from './dto/create-tax-category.dto';
import { UpdateTaxCategoryDto } from './dto/update-tax-category.dto';

@Injectable()
export class TaxCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTaxCategoryDto) {
    return this.prisma.taxCategory.create({
      data: { name: dto.name, rateBp: dto.rateBp },
    });
  }

  async findAll() {
    return this.prisma.taxCategory.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const tc = await this.prisma.taxCategory.findUnique({ where: { id } });
    if (!tc) throw new NotFoundException(`TaxCategory ${id} not found`);
    return tc;
  }

  async update(id: string, dto: UpdateTaxCategoryDto) {
    await this.findOne(id);
    return this.prisma.taxCategory.update({
      where: { id },
      data: { name: dto.name, rateBp: dto.rateBp },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.taxCategory.delete({ where: { id } });
    return { deleted: true, id };
  }

  // ───────────────────── Kenya VAT Calculation Engine (§2.3) ─────────────────────
  async calculateTax(dto: {
    lineItems: Array<{
      productId: string;
      quantity: number;
      unitPriceCents?: number;
      discountCents?: number;
    }>;
  }) {
    let subtotalCents = 0;
    let taxCents = 0;
    const lineResults = [];
    const taxGroupMap = new Map<
      string,
      {
        taxCategoryId: string | null;
        name: string;
        rateBp: number;
        taxableAmountCents: number;
        taxCents: number;
      }
    >();

    for (const item of dto.lineItems) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: { taxCategory: true },
      });
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      const unitPriceCents = item.unitPriceCents ?? product.priceCents;
      const discountCents = item.discountCents ?? 0;
      const quantity = Number(item.quantity);
      const taxCategory = product.taxCategory;
      const taxRateBp = taxCategory?.rateBp ?? 0;
      const categoryName = taxCategory?.name ?? 'exempt';

      const lineSubtotalCents = Math.round(unitPriceCents * quantity) - discountCents;
      // Integer cents rounding for VAT
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
      } else {
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

  // Canonical Kenya tax categories per blueprint §2.3
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
      } else {
        const created = await this.prisma.taxCategory.create({
          data: cat,
        });
        results.push(created);
      }
    }
    return results;
  }
}

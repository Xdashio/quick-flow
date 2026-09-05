import { PrismaService } from '../prisma/prisma.service';
import { CreateTaxCategoryDto } from './dto/create-tax-category.dto';
import { UpdateTaxCategoryDto } from './dto/update-tax-category.dto';
export declare class TaxCategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateTaxCategoryDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        rateBp: number;
    }>;
    findAll(): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        rateBp: number;
    }[]>;
    findOne(id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        rateBp: number;
    }>;
    update(id: string, dto: UpdateTaxCategoryDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        rateBp: number;
    }>;
    remove(id: string): Promise<{
        deleted: boolean;
        id: string;
    }>;
    calculateTax(dto: {
        lineItems: Array<{
            productId: string;
            quantity: number;
            unitPriceCents?: number;
            discountCents?: number;
        }>;
    }): Promise<{
        subtotalCents: number;
        taxCents: number;
        totalCents: number;
        lineItems: {
            productId: string;
            productName: string;
            taxCategoryId: string | null;
            taxCategoryName: string;
            taxRateBp: number;
            quantity: number;
            unitPriceCents: number;
            discountCents: number;
            lineSubtotalCents: number;
            lineTaxCents: number;
            lineTotalCents: number;
        }[];
        taxGroups: {
            taxCategoryId: string | null;
            name: string;
            rateBp: number;
            taxableAmountCents: number;
            taxCents: number;
        }[];
    }>;
    seedStandardCategories(): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        rateBp: number;
    }[]>;
}

import { TaxCategoriesService } from './tax-categories.service';
import { CreateTaxCategoryDto } from './dto/create-tax-category.dto';
import { UpdateTaxCategoryDto } from './dto/update-tax-category.dto';
import { CalculateTaxDto } from './dto/calculate-tax.dto';
export declare class TaxCategoriesController {
    private readonly service;
    constructor(service: TaxCategoriesService);
    create(dto: CreateTaxCategoryDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        rateBp: number;
    }>;
    calculate(dto: CalculateTaxDto): Promise<{
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
    seedStandard(): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        rateBp: number;
    }[]>;
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
}

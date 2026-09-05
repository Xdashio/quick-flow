import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoriesController {
    private readonly service;
    constructor(service: CategoriesService);
    create(dto: CreateCategoryDto): Promise<{
        name: string;
        id: string;
        parentId: string | null;
    }>;
    findAll(): Promise<{
        id: string;
        name: string;
        parentId: string | null;
        productCount: number;
        childCount: number;
    }[]>;
    findOne(id: string): Promise<{
        name: string;
        id: string;
        parentId: string | null;
    }>;
    update(id: string, dto: UpdateCategoryDto): Promise<{
        name: string;
        id: string;
        parentId: string | null;
    }>;
    remove(id: string): Promise<{
        deleted: boolean;
        id: string;
    }>;
}

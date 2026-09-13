import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
export declare class UsersController {
    private readonly service;
    constructor(service: UsersService);
    findAll(): Promise<{
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        role: string;
    }[]>;
    findOne(id: string): Promise<{
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        role: string;
    }>;
    create(dto: CreateUserDto): Promise<{
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        role: string;
    }>;
    update(id: string, dto: UpdateUserDto): Promise<{
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        role: string;
    }>;
}

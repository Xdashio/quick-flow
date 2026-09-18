import { UsersService, Actor } from './users.service';
import { CreateUserDto, UpdateUserDto, UpdateProfileDto } from './dto/user.dto';
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
    create(req: {
        user: Actor;
    }, dto: CreateUserDto): Promise<{
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        role: string;
    }>;
    updateMe(req: {
        user: Actor;
    }, dto: UpdateProfileDto): Promise<{
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        role: string;
    }>;
    update(req: {
        user: Actor;
    }, id: string, dto: UpdateUserDto): Promise<{
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        role: string;
    }>;
}

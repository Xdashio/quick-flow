import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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

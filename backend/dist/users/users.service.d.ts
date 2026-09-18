import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, UpdateProfileDto } from './dto/user.dto';
export interface Actor {
    userId: string;
    name: string;
    role: string;
}
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
    private assertCredentialPolicy;
    private assertNameUnique;
    private assertNotLastAdmin;
    create(dto: CreateUserDto, actor: Actor): Promise<{
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        role: string;
    }>;
    update(id: string, dto: UpdateUserDto, actor: Actor): Promise<{
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        role: string;
    }>;
    updateMe(actor: Actor, dto: UpdateProfileDto): Promise<{
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        role: string;
    }>;
}

import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export interface JwtPayload {
    sub: string;
    name: string;
    role: string;
}
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    login(username: string, password: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            name: string;
            role: string;
        };
    }>;
    getMe(userId: string): Promise<{
        name: string;
        active: boolean;
        id: string;
        createdAt: Date;
        role: string;
    }>;
}

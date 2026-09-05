import { PrismaService } from '../prisma/prisma.service';
import { CreateDrawerEventDto } from './dto/create-drawer-event.dto';
export declare class DrawerEventsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateDrawerEventDto): Promise<{
        id: string;
        createdAt: Date;
        registerId: string | null;
        amountCents: number | null;
        reason: string;
        userId: string | null;
    }>;
    findAll(limit?: number): Promise<{
        id: string;
        createdAt: Date;
        registerId: string | null;
        amountCents: number | null;
        reason: string;
        userId: string | null;
    }[]>;
    findByReason(reason: string): Promise<{
        id: string;
        createdAt: Date;
        registerId: string | null;
        amountCents: number | null;
        reason: string;
        userId: string | null;
    }[]>;
}

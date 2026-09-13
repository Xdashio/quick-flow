import { PrismaService } from '../prisma/prisma.service';
import { CreateDrawerEventDto } from './dto/create-drawer-event.dto';
export declare class DrawerEventsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateDrawerEventDto): Promise<{
        reason: string;
        id: string;
        createdAt: Date;
        registerId: string | null;
        amountCents: number | null;
        userId: string | null;
    }>;
    findAll(limit?: number): Promise<{
        reason: string;
        id: string;
        createdAt: Date;
        registerId: string | null;
        amountCents: number | null;
        userId: string | null;
    }[]>;
    findByReason(reason: string): Promise<{
        reason: string;
        id: string;
        createdAt: Date;
        registerId: string | null;
        amountCents: number | null;
        userId: string | null;
    }[]>;
}

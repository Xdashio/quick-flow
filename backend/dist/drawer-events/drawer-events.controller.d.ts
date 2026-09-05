import { DrawerEventsService } from './drawer-events.service';
import { CreateDrawerEventDto } from './dto/create-drawer-event.dto';
export declare class DrawerEventsController {
    private readonly service;
    constructor(service: DrawerEventsService);
    create(dto: CreateDrawerEventDto): Promise<{
        id: string;
        createdAt: Date;
        registerId: string | null;
        amountCents: number | null;
        reason: string;
        userId: string | null;
    }>;
    findAll(limit?: string, reason?: string): Promise<{
        id: string;
        createdAt: Date;
        registerId: string | null;
        amountCents: number | null;
        reason: string;
        userId: string | null;
    }[]>;
}

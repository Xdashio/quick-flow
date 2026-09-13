import { DrawerEventsService } from './drawer-events.service';
import { CreateDrawerEventDto } from './dto/create-drawer-event.dto';
export declare class DrawerEventsController {
    private readonly service;
    constructor(service: DrawerEventsService);
    create(dto: CreateDrawerEventDto): Promise<{
        reason: string;
        id: string;
        createdAt: Date;
        registerId: string | null;
        amountCents: number | null;
        userId: string | null;
    }>;
    findAll(limit?: string, reason?: string): Promise<{
        reason: string;
        id: string;
        createdAt: Date;
        registerId: string | null;
        amountCents: number | null;
        userId: string | null;
    }[]>;
}

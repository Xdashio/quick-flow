import { LocationsService } from './locations.service';
export declare class LocationsController {
    private readonly service;
    constructor(service: LocationsService);
    findAll(): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        address: string | null;
    }[]>;
    findOne(id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        address: string | null;
    }>;
}

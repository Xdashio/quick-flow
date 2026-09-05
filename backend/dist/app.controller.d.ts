import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): {
        status: string;
        version: string;
    };
    getHealth(): {
        status: string;
        version: string;
        uptime: number;
        timestamp: string;
    };
}

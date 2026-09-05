export declare class AppService {
    getHello(): {
        status: string;
        version: string;
    };
    health(): {
        status: string;
        version: string;
        uptime: number;
        timestamp: string;
    };
}

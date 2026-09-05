import { PrinterService, ReceiptTransaction } from './printer.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class HardwareController {
    private readonly printer;
    private readonly prisma;
    constructor(printer: PrinterService, prisma: PrismaService);
    printTransaction(transactionId: string): Promise<{
        success: boolean;
        bytesLength: number;
        hexPreview: string;
        textPreview: string;
        outputPath: string;
        virtualParsed: string;
        printerType: "network" | "virtual";
    }>;
    printPreview(tx: ReceiptTransaction): Promise<{
        success: boolean;
        bytesLength: number;
        hexPreview: string;
        textPreview: string;
        outputPath: string;
        virtualParsed: string;
        printerType: "network" | "virtual";
    }>;
    kickDrawer(body: {
        pin?: 0 | 1;
    }): Promise<{
        success: boolean;
        bytesHex: string;
        printerType: string;
    }>;
    listVirtual(): string[];
    lastReceipt(): {
        path: string | null;
        hexPreview: string | null;
        textPreview: string | null;
        bytesLength: number;
    };
}

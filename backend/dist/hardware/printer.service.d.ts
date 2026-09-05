export interface ReceiptLineItem {
    name: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
    taxRateBp?: number;
}
export interface ReceiptTransaction {
    id: string;
    createdAt: string | Date;
    locationId?: string;
    registerId?: string | null;
    cashierId?: string | null;
    subtotalCents: number;
    taxCents: number;
    totalCents: number;
    lineItems: ReceiptLineItem[];
    payment?: {
        method: string;
        amountCents: number;
        status: string;
        mpesaReceiptNumber?: string;
        mpesaPhoneNumber?: string;
    };
    changeDueCents?: number;
    amountTenderedCents?: number;
}
export declare class PrinterService {
    private readonly logger;
    private readonly virtualDir;
    private readonly printerHost;
    private readonly printerPort;
    private lastReceiptPath;
    private lastReceiptBytes;
    constructor();
    printReceipt(tx: ReceiptTransaction): Promise<{
        success: boolean;
        bytesLength: number;
        hexPreview: string;
        textPreview: string;
        outputPath: string;
        virtualParsed: string;
        printerType: 'network' | 'virtual';
    }>;
    generateDrawerKickBytes(pin?: 0 | 1): Buffer;
    kickDrawer(pin?: 0 | 1): Promise<{
        success: boolean;
        bytesHex: string;
        printerType: string;
    }>;
    getLastReceipt(): {
        path: string | null;
        bytes: Buffer | null;
    };
    private generateEscPosBytes;
    parseEscPosToText(bytes: Buffer): string;
    private sendToNetworkPrinter;
    getVirtualReceiptList(): string[];
}

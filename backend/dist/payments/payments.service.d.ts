import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
export declare class PaymentsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreatePaymentDto): Promise<{
        id: string;
        status: string;
        transactionId: string;
        method: string;
        amountCents: number;
        mpesaReceiptNumber: string | null;
        mpesaPhoneNumber: string | null;
        checkoutRequestId: string | null;
        etimsInvoiceNumber: string | null;
    }>;
    findAll(transactionId?: string): Promise<{
        id: string;
        status: string;
        transactionId: string;
        method: string;
        amountCents: number;
        mpesaReceiptNumber: string | null;
        mpesaPhoneNumber: string | null;
        checkoutRequestId: string | null;
        etimsInvoiceNumber: string | null;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        status: string;
        transactionId: string;
        method: string;
        amountCents: number;
        mpesaReceiptNumber: string | null;
        mpesaPhoneNumber: string | null;
        checkoutRequestId: string | null;
        etimsInvoiceNumber: string | null;
    }>;
}

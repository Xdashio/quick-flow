export declare class CreatePaymentDto {
    transactionId: string;
    method: string;
    amountCents: number;
    mpesaReceiptNumber?: string;
    mpesaPhoneNumber?: string;
    checkoutRequestId?: string;
    etimsInvoiceNumber?: string;
    status?: string;
}

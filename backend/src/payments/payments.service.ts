import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePaymentDto) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id: dto.transactionId },
    });
    if (!tx) throw new NotFoundException(`Transaction ${dto.transactionId} not found`);

    // Integer cents validation - no float
    if (!Number.isInteger(dto.amountCents) || dto.amountCents < 0) {
      throw new BadRequestException('amountCents must be a non-negative integer (cents)');
    }

    // Cash payments are captured immediately; mpesa may be pending
    const status = dto.status ?? (dto.method === 'cash' ? 'captured' : 'pending');

    const payment = await this.prisma.payment.create({
      data: {
        transactionId: dto.transactionId,
        method: dto.method,
        amountCents: dto.amountCents,
        mpesaReceiptNumber: dto.mpesaReceiptNumber ?? null,
        mpesaPhoneNumber: dto.mpesaPhoneNumber ?? null,
        checkoutRequestId: dto.checkoutRequestId ?? null,
        etimsInvoiceNumber: dto.etimsInvoiceNumber ?? null,
        status,
      },
    });
    return payment;
  }

  async findAll(transactionId?: string) {
    const where: any = {};
    if (transactionId) where.transactionId = transactionId;
    return this.prisma.payment.findMany({
      where,
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: string) {
    const p = await this.prisma.payment.findUnique({ where: { id } });
    if (!p) throw new NotFoundException(`Payment ${id} not found`);
    return p;
  }
}

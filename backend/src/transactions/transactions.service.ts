import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

/**
 * Transaction state machine (§2.1 of blueprint):
 * DRAFT → IN_PROGRESS → AWAITING_PAYMENT → PAYMENT_CAPTURED → COMPLETED
 *                                         ↘ PAYMENT_FAILED → VOIDED
 * COMPLETED → REFUND_REQUESTED → REFUNDED
 * COMPLETED → VOID_REQUESTED → VOIDED
 */
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['IN_PROGRESS', 'VOIDED'],
  IN_PROGRESS: ['AWAITING_PAYMENT', 'PAYMENT_CAPTURED', 'COMPLETED', 'VOIDED'],
  AWAITING_PAYMENT: ['PAYMENT_CAPTURED', 'PAYMENT_FAILED', 'COMPLETED', 'VOIDED'],
  PAYMENT_CAPTURED: ['COMPLETED'],
  PAYMENT_FAILED: ['VOIDED', 'AWAITING_PAYMENT'],
  COMPLETED: ['REFUND_REQUESTED', 'VOID_REQUESTED'],
  REFUND_REQUESTED: ['REFUNDED'],
  VOID_REQUESTED: ['VOIDED'],
  REFUNDED: [],
  VOIDED: [],
};

export const ALL_STATUSES = Object.keys(ALLOWED_TRANSITIONS);

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  private assertValidStatus(status: string) {
    if (!ALL_STATUSES.includes(status)) {
      throw new BadRequestException(
        `Invalid status '${status}'. Valid: ${ALL_STATUSES.join(', ')}`,
      );
    }
  }

  private assertTransition(from: string, to: string) {
    this.assertValidStatus(to);
    if (from === to) return; // idempotent no-op allowed
    const allowed = ALLOWED_TRANSITIONS[from];
    if (!allowed) {
      throw new BadRequestException(`Unknown current status '${from}'`);
    }
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `Illegal transition ${from} → ${to}. Allowed from ${from}: ${allowed.length ? allowed.join(', ') : '(terminal – no outgoing transitions)'}`,
      );
    }
  }

  async create(dto: CreateTransactionDto) {
    const status = dto.status ?? 'DRAFT';
    this.assertValidStatus(status);
    // Only allow creating in initial states (DRAFT or IN_PROGRESS) – enforce DRAFT default
    if (status !== 'DRAFT' && status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        `Transactions can only be created in DRAFT or IN_PROGRESS, got ${status}`,
      );
    }

    // Verify FK existence early for better error messages
    const location = await this.prisma.location.findUnique({
      where: { id: dto.locationId },
    });
    if (!location)
      throw new NotFoundException(`Location ${dto.locationId} not found`);

    if (dto.registerId) {
      const reg = await this.prisma.register.findUnique({
        where: { id: dto.registerId },
      });
      if (!reg)
        throw new NotFoundException(`Register ${dto.registerId} not found`);
    }
    if (dto.cashierId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.cashierId },
      });
      if (!user)
        throw new NotFoundException(`User (cashier) ${dto.cashierId} not found`);
    }
    if (dto.customerId) {
      const cust = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
      });
      if (!cust)
        throw new NotFoundException(`Customer ${dto.customerId} not found`);
    }

    const now = dto.createdAt ? new Date(dto.createdAt) : new Date();

    // Compute totals if lineItems provided and totals not explicitly set – but always trust frozen values per blueprint
    let subtotalCents = dto.subtotalCents ?? 0;
    let taxCents = dto.taxCents ?? 0;
    let totalCents = dto.totalCents ?? 0;
    if (dto.lineItems && dto.lineItems.length > 0) {
      if (
        dto.subtotalCents === undefined ||
        dto.taxCents === undefined ||
        dto.totalCents === undefined
      ) {
        // Derive from lineItems if not provided – lineTotal already includes tax? In blueprint lineTotalCents is final line total.
        // We'll sum lineTotalCents for total, subtotal as sum of (unitPrice*qty - discount), tax as remainder.
        const lineTotalSum = dto.lineItems.reduce(
          (s, li) => s + li.lineTotalCents,
          0,
        );
        // If totals missing, assume subtotal = sum of (unitPrice*qty - discount), tax = lineTotal - subtotal, total = lineTotal
        // But simpler: if any total missing, default to lineTotalSum for total and 0 for tax/subtotal fallback
        if (dto.totalCents === undefined) totalCents = lineTotalSum;
        if (dto.subtotalCents === undefined) {
          const subtotalCalc = dto.lineItems.reduce(
            (s, li) => s + li.unitPriceCents * li.quantity - (li.discountCents ?? 0),
            0,
          );
          subtotalCents = Math.round(subtotalCalc);
        }
        if (dto.taxCents === undefined) taxCents = totalCents - subtotalCents;
      }
    }

    try {
      const txId = dto.id ?? randomUUID();
      const tx = await this.prisma.transaction.create({
        data: {
          id: txId,
          locationId: dto.locationId,
          registerId: dto.registerId ?? null,
          cashierId: dto.cashierId ?? null,
          status,
          subtotalCents,
          taxCents,
          totalCents,
          customerId: dto.customerId ?? null,
          voidedReason: dto.voidedReason ?? null,
          parentTransactionId: dto.parentTransactionId ?? null,
          createdAt: now,
          syncedAt: new Date(),
          lineItems: dto.lineItems
            ? {
                create: dto.lineItems.map((li) => ({
                  productId: li.productId,
                  quantity: li.quantity,
                  unitPriceCents: li.unitPriceCents,
                  taxRateBp: li.taxRateBp,
                  discountCents: li.discountCents ?? 0,
                  lineTotalCents: li.lineTotalCents,
                })),
              }
            : undefined,
        },
        include: { lineItems: true, payments: true },
      });
      return tx;
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException(
          `Transaction with id ${dto.id} already exists (idempotent retry?)`,
        );
      }
      // P2003 FK violation
      if (e.code === 'P2003') {
        throw new BadRequestException(`Foreign key violation: ${e.message}`);
      }
      throw e;
    }
  }

  async findAll() {
    return this.prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: { lineItems: true, payments: true },
      take: 100,
    });
  }

  async findOne(id: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id },
      include: { lineItems: { include: { product: true } }, payments: true },
    });
    if (!tx) throw new NotFoundException(`Transaction ${id} not found`);
    return tx;
  }

  async update(id: string, dto: UpdateTransactionDto) {
    const existing = await this.findOne(id);

    // Enforce immutability once COMPLETED/REFUNDED/VOIDED for lineItems
    if (
      dto.lineItems &&
      ['COMPLETED', 'REFUNDED', 'VOIDED'].includes(existing.status)
    ) {
      throw new BadRequestException(
        `Line items are immutable once transaction is ${existing.status}`,
      );
    }

    if (dto.status) {
      this.assertTransition(existing.status, dto.status);
    }

    const newStatus = dto.status ?? existing.status;

    // If lineItems provided, replace them atomically (only allowed in non-terminal states)
    if (dto.lineItems) {
      // Validate all products exist
      for (const li of dto.lineItems) {
        const prod = await this.prisma.product.findUnique({
          where: { id: li.productId },
        });
        if (!prod)
          throw new NotFoundException(`Product ${li.productId} not found`);
      }

      return this.prisma.$transaction(async (tx) => {
        await tx.transactionLineItem.deleteMany({
          where: { transactionId: id },
        });
        const updated = await tx.transaction.update({
          where: { id },
          data: {
            status: newStatus,
            voidedReason: dto.voidedReason ?? existing.voidedReason,
            subtotalCents: dto.subtotalCents ?? existing.subtotalCents,
            taxCents: dto.taxCents ?? existing.taxCents,
            totalCents: dto.totalCents ?? existing.totalCents,
            customerId: dto.customerId ?? existing.customerId,
            lineItems: {
              create: dto.lineItems!.map((li) => ({
                productId: li.productId,
                quantity: li.quantity,
                unitPriceCents: li.unitPriceCents,
                taxRateBp: li.taxRateBp,
                discountCents: li.discountCents ?? 0,
                lineTotalCents: li.lineTotalCents,
              })),
            },
          },
          include: { lineItems: true, payments: true },
        });
        return updated;
      });
    }

    // Status-only (or metadata-only) update
    const updated = await this.prisma.transaction.update({
      where: { id },
      data: {
        status: newStatus,
        voidedReason: dto.voidedReason ?? undefined,
        subtotalCents: dto.subtotalCents ?? undefined,
        taxCents: dto.taxCents ?? undefined,
        totalCents: dto.totalCents ?? undefined,
        customerId: dto.customerId ?? undefined,
      },
      include: { lineItems: true, payments: true },
    });
    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.transaction.delete({ where: { id } });
    return { deleted: true, id };
  }
}

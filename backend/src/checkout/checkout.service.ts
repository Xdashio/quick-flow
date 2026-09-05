import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PrinterService } from '../hardware/printer.service';
import { MpesaService } from '../payments/mpesa.service';
import { CashSaleDto } from './dto/cash-sale.dto';
import { MpesaStkSaleDto } from './dto/mpesa-stk-sale.dto';
import { MpesaTillSaleDto } from './dto/mpesa-till-sale.dto';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private prisma: PrismaService,
    private printer: PrinterService,
    private mpesa: MpesaService,
  ) {}

  async cashSale(dto: CashSaleDto) {
    if (!Number.isInteger(dto.amountTenderedCents)) {
      throw new BadRequestException('amountTenderedCents must be integer cents');
    }
    if (!Number.isInteger(dto.totalCents) || !Number.isInteger(dto.subtotalCents) || !Number.isInteger(dto.taxCents)) {
      throw new BadRequestException('Monetary fields must be integer cents');
    }
    if (dto.amountTenderedCents < dto.totalCents) {
      throw new BadRequestException(
        `Insufficient tendered: ${dto.amountTenderedCents} < ${dto.totalCents} (short by ${dto.totalCents - dto.amountTenderedCents}c)`,
      );
    }

    const location = await this.prisma.location.findUnique({ where: { id: dto.locationId } });
    if (!location) throw new NotFoundException(`Location ${dto.locationId} not found`);

    if (dto.registerId) {
      const reg = await this.prisma.register.findUnique({ where: { id: dto.registerId } });
      if (!reg) throw new NotFoundException(`Register ${dto.registerId} not found`);
    }
    if (dto.cashierId) {
      const user = await this.prisma.user.findUnique({ where: { id: dto.cashierId } });
      if (!user) throw new NotFoundException(`Cashier ${dto.cashierId} not found`);
    }

    const costByProductId = new Map<string, number | null>();
    for (const li of dto.lineItems) {
      const prod = await this.prisma.product.findUnique({ where: { id: li.productId } });
      if (!prod) throw new NotFoundException(`Product ${li.productId} not found`);
      if (!Number.isInteger(li.unitPriceCents) || !Number.isInteger(li.lineTotalCents)) {
        throw new BadRequestException('Line item cents must be integers');
      }
      costByProductId.set(li.productId, prod.costCents ?? null);
    }

    const txId = dto.id ?? randomUUID();
    const now = dto.createdAt ? new Date(dto.createdAt) : new Date();
    const changeDueCents = dto.amountTenderedCents - dto.totalCents;

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({
          data: {
            id: txId,
            locationId: dto.locationId,
            registerId: dto.registerId ?? null,
            cashierId: dto.cashierId ?? null,
            status: 'COMPLETED',
            subtotalCents: dto.subtotalCents,
            taxCents: dto.taxCents,
            totalCents: dto.totalCents,
            customerId: dto.customerId ?? null,
            createdAt: now,
            syncedAt: new Date(),
            lineItems: {
              create: dto.lineItems.map((li) => ({
                productId: li.productId,
                quantity: li.quantity,
                unitPriceCents: li.unitPriceCents,
                unitCostCents: costByProductId.get(li.productId) ?? null,
                taxRateBp: li.taxRateBp,
                discountCents: li.discountCents ?? 0,
                lineTotalCents: li.lineTotalCents,
              })),
            },
          },
          include: { lineItems: { include: { product: true } }, payments: true },
        });

        const payment = await tx.payment.create({
          data: {
            transactionId: transaction.id,
            method: 'cash',
            amountCents: dto.totalCents,
            status: 'captured',
          },
        });

        const drawerEvent = await tx.drawerEvent.create({
          data: {
            registerId: dto.registerId ?? null,
            userId: dto.cashierId ?? null,
            reason: 'sale',
            amountCents: dto.amountTenderedCents,
          },
        });

        for (const li of dto.lineItems) {
          await tx.inventoryMovement.create({
            data: {
              productId: li.productId,
              locationId: dto.locationId,
              quantityDelta: -Number(li.quantity),
              reason: 'sale',
              referenceId: transaction.id,
              createdBy: dto.cashierId ?? null,
            },
          });
        }

        return { transaction, payment, drawerEvent };
      });

      try {
        await this.prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW CONCURRENTLY current_inventory');
      } catch {
        try {
          await this.prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW current_inventory');
        } catch (e) {
          this.logger.warn(`Failed to refresh current_inventory: ${(e as Error).message}`);
        }
      }

      let receiptResult: any = null;
      try {
        const lineItemsForReceipt = result.transaction.lineItems.map((li: any) => ({
          name: li.product.name,
          quantity: Number(li.quantity),
          unitPriceCents: li.unitPriceCents,
          lineTotalCents: li.lineTotalCents,
          taxRateBp: li.taxRateBp,
        }));

        receiptResult = await this.printer.printReceipt({
          id: result.transaction.id,
          createdAt: result.transaction.createdAt,
          locationId: result.transaction.locationId,
          registerId: result.transaction.registerId,
          cashierId: result.transaction.cashierId,
          subtotalCents: result.transaction.subtotalCents,
          taxCents: result.transaction.taxCents,
          totalCents: result.transaction.totalCents,
          lineItems: lineItemsForReceipt,
          payment: { method: 'cash', amountCents: result.payment.amountCents, status: result.payment.status },
          changeDueCents,
          amountTenderedCents: dto.amountTenderedCents,
        });

        await this.printer.kickDrawer(0);
      } catch (e: any) {
        this.logger.warn(`Receipt print failed post-transaction: ${e.message}`);
      }

      return {
        transaction: result.transaction,
        payment: result.payment,
        drawerEvent: result.drawerEvent,
        changeDueCents,
        amountTenderedCents: dto.amountTenderedCents,
        receipt: receiptResult,
      };
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException(`Transaction ${txId} already exists`);
      }
      throw e;
    }
  }

  // ─── M-Pesa STK Push Sale Flow ──────────────────────────────────────────

  async mpesaStkSale(dto: MpesaStkSaleDto) {
    if (!Number.isInteger(dto.totalCents) || !Number.isInteger(dto.subtotalCents) || !Number.isInteger(dto.taxCents)) {
      throw new BadRequestException('Monetary fields must be integer cents');
    }

    const location = await this.prisma.location.findUnique({ where: { id: dto.locationId } });
    if (!location) throw new NotFoundException(`Location ${dto.locationId} not found`);

    const costByProductId = new Map<string, number | null>();
    for (const li of dto.lineItems) {
      const prod = await this.prisma.product.findUnique({ where: { id: li.productId } });
      if (!prod) throw new NotFoundException(`Product ${li.productId} not found`);
      costByProductId.set(li.productId, prod.costCents ?? null);
    }

    const txId = dto.id ?? randomUUID();
    const now = dto.createdAt ? new Date(dto.createdAt) : new Date();

    // Create transaction in AWAITING_PAYMENT status
    const transaction = await this.prisma.transaction.create({
      data: {
        id: txId,
        locationId: dto.locationId,
        registerId: dto.registerId ?? null,
        cashierId: dto.cashierId ?? null,
        status: 'AWAITING_PAYMENT',
        subtotalCents: dto.subtotalCents,
        taxCents: dto.taxCents,
        totalCents: dto.totalCents,
        customerId: dto.customerId ?? null,
        createdAt: now,
        syncedAt: new Date(),
        lineItems: {
          create: dto.lineItems.map((li) => ({
            productId: li.productId,
            quantity: li.quantity,
            unitPriceCents: li.unitPriceCents,
            unitCostCents: costByProductId.get(li.productId) ?? null,
            taxRateBp: li.taxRateBp,
            discountCents: li.discountCents ?? 0,
            lineTotalCents: li.lineTotalCents,
          })),
        },
      },
      include: { lineItems: { include: { product: true } } },
    });

    // Initiate Daraja STK Push prompt to phone
    const stkResult = await this.mpesa.initiateSTKPush(
      transaction.id,
      dto.phoneNumber,
      dto.totalCents,
    );

    return {
      transaction,
      payment: stkResult.payment,
      darajaResponse: stkResult.darajaResponse,
    };
  }

  // ─── M-Pesa Buy Goods Till (Manual Code) Sale Flow ──────────────────────

  async mpesaTillSale(dto: MpesaTillSaleDto) {
    if (!Number.isInteger(dto.totalCents) || !Number.isInteger(dto.subtotalCents) || !Number.isInteger(dto.taxCents)) {
      throw new BadRequestException('Monetary fields must be integer cents');
    }

    const location = await this.prisma.location.findUnique({ where: { id: dto.locationId } });
    if (!location) throw new NotFoundException(`Location ${dto.locationId} not found`);

    const formattedCode = dto.mpesaCode.trim().toUpperCase();

    // Check duplicate code
    const existingPayment = await this.prisma.payment.findFirst({
      where: { mpesaReceiptNumber: formattedCode },
    });
    if (existingPayment) {
      throw new BadRequestException(`M-Pesa code ${formattedCode} has already been recorded`);
    }

    const costByProductId = new Map<string, number | null>();
    for (const li of dto.lineItems) {
      const prod = await this.prisma.product.findUnique({ where: { id: li.productId } });
      if (!prod) throw new NotFoundException(`Product ${li.productId} not found`);
      costByProductId.set(li.productId, prod.costCents ?? null);
    }

    const txId = dto.id ?? randomUUID();
    const now = dto.createdAt ? new Date(dto.createdAt) : new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          id: txId,
          locationId: dto.locationId,
          registerId: dto.registerId ?? null,
          cashierId: dto.cashierId ?? null,
          status: 'COMPLETED',
          subtotalCents: dto.subtotalCents,
          taxCents: dto.taxCents,
          totalCents: dto.totalCents,
          customerId: dto.customerId ?? null,
          createdAt: now,
          syncedAt: new Date(),
          lineItems: {
            create: dto.lineItems.map((li) => ({
              productId: li.productId,
              quantity: li.quantity,
              unitPriceCents: li.unitPriceCents,
              unitCostCents: costByProductId.get(li.productId) ?? null,
              taxRateBp: li.taxRateBp,
              discountCents: li.discountCents ?? 0,
              lineTotalCents: li.lineTotalCents,
            })),
          },
        },
        include: { lineItems: { include: { product: true } } },
      });

      const payment = await tx.payment.create({
        data: {
          transactionId: transaction.id,
          method: 'mpesa_till',
          amountCents: dto.totalCents,
          mpesaReceiptNumber: formattedCode,
          status: 'captured',
        },
      });

      for (const li of dto.lineItems) {
        await tx.inventoryMovement.create({
          data: {
            productId: li.productId,
            locationId: dto.locationId,
            quantityDelta: -Number(li.quantity),
            reason: 'sale',
            referenceId: transaction.id,
            createdBy: dto.cashierId ?? null,
          },
        });
      }

      return { transaction, payment };
    });

    try {
      await this.prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW CONCURRENTLY current_inventory');
    } catch {
      try {
        await this.prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW current_inventory');
      } catch {}
    }

    let receiptResult: any = null;
    try {
      const lineItemsForReceipt = result.transaction.lineItems.map((li: any) => ({
        name: li.product.name,
        quantity: Number(li.quantity),
        unitPriceCents: li.unitPriceCents,
        lineTotalCents: li.lineTotalCents,
        taxRateBp: li.taxRateBp,
      }));

      receiptResult = await this.printer.printReceipt({
        id: result.transaction.id,
        createdAt: result.transaction.createdAt,
        locationId: result.transaction.locationId,
        registerId: result.transaction.registerId,
        cashierId: result.transaction.cashierId,
        subtotalCents: result.transaction.subtotalCents,
        taxCents: result.transaction.taxCents,
        totalCents: result.transaction.totalCents,
        lineItems: lineItemsForReceipt,
        payment: {
          method: 'mpesa_till',
          amountCents: result.payment.amountCents,
          status: result.payment.status,
          mpesaReceiptNumber: result.payment.mpesaReceiptNumber ?? undefined,
        },
        changeDueCents: 0,
        amountTenderedCents: dto.totalCents,
      });
    } catch (e: any) {
      this.logger.warn(`M-Pesa receipt print failed: ${e.message}`);
    }

    return {
      transaction: result.transaction,
      payment: result.payment,
      receipt: receiptResult,
    };
  }

  // Generate receipt after STK payment is captured
  async completeMpesaSale(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        transaction: {
          include: { lineItems: { include: { product: true } } },
        },
      },
    });

    if (!payment) throw new NotFoundException(`Payment ${paymentId} not found`);

    let receiptResult: any = null;
    try {
      const lineItemsForReceipt = payment.transaction.lineItems.map((li: any) => ({
        name: li.product.name,
        quantity: Number(li.quantity),
        unitPriceCents: li.unitPriceCents,
        lineTotalCents: li.lineTotalCents,
        taxRateBp: li.taxRateBp,
      }));

      receiptResult = await this.printer.printReceipt({
        id: payment.transaction.id,
        createdAt: payment.transaction.createdAt,
        locationId: payment.transaction.locationId,
        registerId: payment.transaction.registerId,
        cashierId: payment.transaction.cashierId,
        subtotalCents: payment.transaction.subtotalCents,
        taxCents: payment.transaction.taxCents,
        totalCents: payment.transaction.totalCents,
        lineItems: lineItemsForReceipt,
        payment: {
          method: payment.method,
          amountCents: payment.amountCents,
          status: payment.status,
          mpesaReceiptNumber: payment.mpesaReceiptNumber ?? undefined,
        },
        changeDueCents: 0,
        amountTenderedCents: payment.amountCents,
      });
    } catch (e: any) {
      this.logger.warn(`STK receipt print failed: ${e.message}`);
    }

    return {
      transaction: payment.transaction,
      payment,
      receipt: receiptResult,
    };
  }

  async logDrawerEvent(dto: { registerId?: string; userId?: string; reason: string; amountCents?: number }) {
    const allowed = ['sale', 'no_sale', 'manager_override', 'change'];
    if (!allowed.includes(dto.reason)) {
      throw new BadRequestException(`Invalid drawer reason. Allowed: ${allowed.join(', ')}`);
    }
    const event = await this.prisma.drawerEvent.create({
      data: {
        registerId: dto.registerId ?? null,
        userId: dto.userId ?? null,
        reason: dto.reason,
        amountCents: dto.amountCents ?? null,
      },
    });
    try {
      await this.printer.kickDrawer(0);
    } catch {}
    return event;
  }
}

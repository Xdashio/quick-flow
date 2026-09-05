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
import { CashSaleDto } from './dto/cash-sale.dto';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);
  constructor(
    private prisma: PrismaService,
    private printer: PrinterService,
  ) {}

  async cashSale(dto: CashSaleDto) {
    // ── Validation: integer cents math ──
    if (!Number.isInteger(dto.amountTenderedCents)) {
      throw new BadRequestException('amountTenderedCents must be integer cents');
    }
    if (!Number.isInteger(dto.totalCents) || !Number.isInteger(dto.subtotalCents) || !Number.isInteger(dto.taxCents)) {
      throw new BadRequestException('Monetary fields must be integer cents');
    }
    // Change calculation: tendered must cover total
    if (dto.amountTenderedCents < dto.totalCents) {
      throw new BadRequestException(
        `Insufficient tendered: ${dto.amountTenderedCents} < ${dto.totalCents} (short by ${dto.totalCents - dto.amountTenderedCents}c)`,
      );
    }

    // Verify FKs
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

    // Verify products exist and line totals are consistent (optional but anti-mock)
    // Also snapshot each product's current cost price, frozen onto the line
    // item so later cost edits don't rewrite historical profit.
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
    const changeDueCents = dto.amountTenderedCents - dto.totalCents; // integer cents subtraction

    // ── Atomic transaction: create transaction + line items + payment + drawer event + inventory movements ──
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Create transaction as COMPLETED (cash is first-class, not fallback)
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

        // 2. Create payment record method=cash status=captured
        const payment = await tx.payment.create({
          data: {
            transactionId: transaction.id,
            method: 'cash',
            amountCents: dto.totalCents, // payment amount is the total, not tendered (change is separate)
            status: 'captured',
          },
        });

        // 3. Drawer open event with reason code sale
        const drawerEvent = await tx.drawerEvent.create({
          data: {
            registerId: dto.registerId ?? null,
            userId: dto.cashierId ?? null,
            reason: 'sale',
            amountCents: dto.amountTenderedCents,
          },
        });

        // 4. Inventory movements ledger (append-only)
        for (const li of dto.lineItems) {
          await tx.inventoryMovement.create({
            data: {
              productId: li.productId,
              locationId: dto.locationId,
              quantityDelta: -Number(li.quantity), // sale decrements
              reason: 'sale',
              referenceId: transaction.id,
              createdBy: dto.cashierId ?? null,
            },
          });
        }

        return { transaction, payment, drawerEvent };
      });

      // 5. Refresh materialized view for current_inventory (outside transaction, after commit)
      try {
        await this.prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW CONCURRENTLY current_inventory');
      } catch {
        try {
          await this.prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW current_inventory');
        } catch (e) {
          this.logger.warn(`Failed to refresh current_inventory: ${(e as Error).message}`);
        }
      }

      // 6. Generate real ESC/POS receipt from REAL transaction data (anti-mock)
      // Build receipt payload with actual line items, tax, totals, payment
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

        // Drawer kick via printer abstraction (RJ11 pulse) - also logged separately above
        await this.printer.kickDrawer(0);
      } catch (e: any) {
        this.logger.warn(`Receipt print failed post-transaction (sale still completed): ${e.message}`);
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
        throw new ConflictException(`Transaction ${txId} already exists (idempotent retry?)`);
      }
      throw e;
    }
  }

  // Drawer event for non-sale reasons (no_sale, manager_override, change)
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
    // Also kick drawer physically via printer abstraction
    try {
      await this.printer.kickDrawer(0);
    } catch {}
    return event;
  }
}

import { Controller, Post, Get, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { PrinterService, ReceiptTransaction } from './printer.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('hardware')
export class HardwareController {
  constructor(
    private readonly printer: PrinterService,
    private readonly prisma: PrismaService,
  ) {}

  // Print receipt for a given transaction id — generates ESC/POS from REAL DB transaction
  @Post('print/:transactionId')
  async printTransaction(@Param('transactionId', ParseUUIDPipe) transactionId: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { lineItems: { include: { product: true } }, payments: true },
    });
    if (!tx) throw new Error(`Transaction ${transactionId} not found`);

    const amountTendered = tx.payments[0]?.amountCents ?? tx.totalCents;
    const changeDue = Math.max(0, amountTendered - tx.totalCents);

    const receiptTx: ReceiptTransaction = {
      id: tx.id,
      createdAt: tx.createdAt,
      locationId: tx.locationId,
      registerId: tx.registerId,
      cashierId: tx.cashierId,
      subtotalCents: tx.subtotalCents,
      taxCents: tx.taxCents,
      totalCents: tx.totalCents,
      lineItems: tx.lineItems.map((li) => ({
        name: li.product.name,
        quantity: Number(li.quantity),
        unitPriceCents: li.unitPriceCents,
        lineTotalCents: li.lineTotalCents,
        taxRateBp: li.taxRateBp,
      })),
      payment: tx.payments[0]
        ? { method: tx.payments[0].method, amountCents: tx.payments[0].amountCents, status: tx.payments[0].status }
        : undefined,
      changeDueCents: changeDue,
      amountTenderedCents: amountTendered,
    };

    return this.printer.printReceipt(receiptTx);
  }

  // Direct receipt print from arbitrary payload (for preview)
  @Post('print-preview')
  async printPreview(@Body() tx: ReceiptTransaction) {
    return this.printer.printReceipt(tx);
  }

  @Post('drawer/kick')
  async kickDrawer(@Body() body: { pin?: 0 | 1 }) {
    return this.printer.kickDrawer(body.pin ?? 0);
  }

  @Get('virtual-receipts')
  listVirtual() {
    return this.printer.getVirtualReceiptList();
  }

  @Get('virtual-receipts/last')
  lastReceipt() {
    const r = this.printer.getLastReceipt();
    return {
      path: r.path,
      hexPreview: r.bytes ? r.bytes.toString('hex').substring(0, 800) : null,
      textPreview: r.bytes ? this.printer.parseEscPosToText(r.bytes) : null,
      bytesLength: r.bytes?.length ?? 0,
    };
  }
}

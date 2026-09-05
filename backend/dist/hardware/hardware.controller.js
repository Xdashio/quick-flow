"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HardwareController = void 0;
const common_1 = require("@nestjs/common");
const printer_service_1 = require("./printer.service");
const prisma_service_1 = require("../prisma/prisma.service");
let HardwareController = class HardwareController {
    printer;
    prisma;
    constructor(printer, prisma) {
        this.printer = printer;
        this.prisma = prisma;
    }
    async printTransaction(transactionId) {
        const tx = await this.prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { lineItems: { include: { product: true } }, payments: true },
        });
        if (!tx)
            throw new Error(`Transaction ${transactionId} not found`);
        const amountTendered = tx.payments[0]?.amountCents ?? tx.totalCents;
        const changeDue = Math.max(0, amountTendered - tx.totalCents);
        const receiptTx = {
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
    async printPreview(tx) {
        return this.printer.printReceipt(tx);
    }
    async kickDrawer(body) {
        return this.printer.kickDrawer(body.pin ?? 0);
    }
    listVirtual() {
        return this.printer.getVirtualReceiptList();
    }
    lastReceipt() {
        const r = this.printer.getLastReceipt();
        return {
            path: r.path,
            hexPreview: r.bytes ? r.bytes.toString('hex').substring(0, 800) : null,
            textPreview: r.bytes ? this.printer.parseEscPosToText(r.bytes) : null,
            bytesLength: r.bytes?.length ?? 0,
        };
    }
};
exports.HardwareController = HardwareController;
__decorate([
    (0, common_1.Post)('print/:transactionId'),
    __param(0, (0, common_1.Param)('transactionId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HardwareController.prototype, "printTransaction", null);
__decorate([
    (0, common_1.Post)('print-preview'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HardwareController.prototype, "printPreview", null);
__decorate([
    (0, common_1.Post)('drawer/kick'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HardwareController.prototype, "kickDrawer", null);
__decorate([
    (0, common_1.Get)('virtual-receipts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HardwareController.prototype, "listVirtual", null);
__decorate([
    (0, common_1.Get)('virtual-receipts/last'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HardwareController.prototype, "lastReceipt", null);
exports.HardwareController = HardwareController = __decorate([
    (0, common_1.Controller)('hardware'),
    __metadata("design:paramtypes", [printer_service_1.PrinterService,
        prisma_service_1.PrismaService])
], HardwareController);
//# sourceMappingURL=hardware.controller.js.map
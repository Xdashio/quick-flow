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
var CheckoutService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const printer_service_1 = require("../hardware/printer.service");
const mpesa_service_1 = require("../payments/mpesa.service");
let CheckoutService = CheckoutService_1 = class CheckoutService {
    prisma;
    printer;
    mpesa;
    logger = new common_1.Logger(CheckoutService_1.name);
    constructor(prisma, printer, mpesa) {
        this.prisma = prisma;
        this.printer = printer;
        this.mpesa = mpesa;
    }
    async cashSale(dto) {
        if (!Number.isInteger(dto.amountTenderedCents)) {
            throw new common_1.BadRequestException('amountTenderedCents must be integer cents');
        }
        if (!Number.isInteger(dto.totalCents) || !Number.isInteger(dto.subtotalCents) || !Number.isInteger(dto.taxCents)) {
            throw new common_1.BadRequestException('Monetary fields must be integer cents');
        }
        if (dto.amountTenderedCents < dto.totalCents) {
            throw new common_1.BadRequestException(`Insufficient tendered: ${dto.amountTenderedCents} < ${dto.totalCents} (short by ${dto.totalCents - dto.amountTenderedCents}c)`);
        }
        const location = await this.prisma.location.findUnique({ where: { id: dto.locationId } });
        if (!location)
            throw new common_1.NotFoundException(`Location ${dto.locationId} not found`);
        if (dto.registerId) {
            const reg = await this.prisma.register.findUnique({ where: { id: dto.registerId } });
            if (!reg)
                throw new common_1.NotFoundException(`Register ${dto.registerId} not found`);
        }
        if (dto.cashierId) {
            const user = await this.prisma.user.findUnique({ where: { id: dto.cashierId } });
            if (!user)
                throw new common_1.NotFoundException(`Cashier ${dto.cashierId} not found`);
        }
        const costByProductId = new Map();
        for (const li of dto.lineItems) {
            const prod = await this.prisma.product.findUnique({ where: { id: li.productId } });
            if (!prod)
                throw new common_1.NotFoundException(`Product ${li.productId} not found`);
            if (!Number.isInteger(li.unitPriceCents) || !Number.isInteger(li.lineTotalCents)) {
                throw new common_1.BadRequestException('Line item cents must be integers');
            }
            costByProductId.set(li.productId, prod.costCents ?? null);
        }
        const txId = dto.id ?? (0, crypto_1.randomUUID)();
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
            }
            catch {
                try {
                    await this.prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW current_inventory');
                }
                catch (e) {
                    this.logger.warn(`Failed to refresh current_inventory: ${e.message}`);
                }
            }
            let receiptResult = null;
            try {
                const lineItemsForReceipt = result.transaction.lineItems.map((li) => ({
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
            }
            catch (e) {
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
        }
        catch (e) {
            if (e.code === 'P2002') {
                throw new common_1.ConflictException(`Transaction ${txId} already exists`);
            }
            throw e;
        }
    }
    async mpesaStkSale(dto) {
        if (!Number.isInteger(dto.totalCents) || !Number.isInteger(dto.subtotalCents) || !Number.isInteger(dto.taxCents)) {
            throw new common_1.BadRequestException('Monetary fields must be integer cents');
        }
        const location = await this.prisma.location.findUnique({ where: { id: dto.locationId } });
        if (!location)
            throw new common_1.NotFoundException(`Location ${dto.locationId} not found`);
        const costByProductId = new Map();
        for (const li of dto.lineItems) {
            const prod = await this.prisma.product.findUnique({ where: { id: li.productId } });
            if (!prod)
                throw new common_1.NotFoundException(`Product ${li.productId} not found`);
            costByProductId.set(li.productId, prod.costCents ?? null);
        }
        const txId = dto.id ?? (0, crypto_1.randomUUID)();
        const now = dto.createdAt ? new Date(dto.createdAt) : new Date();
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
        const stkResult = await this.mpesa.initiateSTKPush(transaction.id, dto.phoneNumber, dto.totalCents);
        return {
            transaction,
            payment: stkResult.payment,
            darajaResponse: stkResult.darajaResponse,
        };
    }
    async mpesaTillSale(dto) {
        if (!Number.isInteger(dto.totalCents) || !Number.isInteger(dto.subtotalCents) || !Number.isInteger(dto.taxCents)) {
            throw new common_1.BadRequestException('Monetary fields must be integer cents');
        }
        const location = await this.prisma.location.findUnique({ where: { id: dto.locationId } });
        if (!location)
            throw new common_1.NotFoundException(`Location ${dto.locationId} not found`);
        const formattedCode = dto.mpesaCode.trim().toUpperCase();
        const existingPayment = await this.prisma.payment.findFirst({
            where: { mpesaReceiptNumber: formattedCode },
        });
        if (existingPayment) {
            throw new common_1.BadRequestException(`M-Pesa code ${formattedCode} has already been recorded`);
        }
        const costByProductId = new Map();
        for (const li of dto.lineItems) {
            const prod = await this.prisma.product.findUnique({ where: { id: li.productId } });
            if (!prod)
                throw new common_1.NotFoundException(`Product ${li.productId} not found`);
            costByProductId.set(li.productId, prod.costCents ?? null);
        }
        const txId = dto.id ?? (0, crypto_1.randomUUID)();
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
        }
        catch {
            try {
                await this.prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW current_inventory');
            }
            catch { }
        }
        let receiptResult = null;
        try {
            const lineItemsForReceipt = result.transaction.lineItems.map((li) => ({
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
        }
        catch (e) {
            this.logger.warn(`M-Pesa receipt print failed: ${e.message}`);
        }
        return {
            transaction: result.transaction,
            payment: result.payment,
            receipt: receiptResult,
        };
    }
    async completeMpesaSale(paymentId) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                transaction: {
                    include: { lineItems: { include: { product: true } } },
                },
            },
        });
        if (!payment)
            throw new common_1.NotFoundException(`Payment ${paymentId} not found`);
        let receiptResult = null;
        try {
            const lineItemsForReceipt = payment.transaction.lineItems.map((li) => ({
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
        }
        catch (e) {
            this.logger.warn(`STK receipt print failed: ${e.message}`);
        }
        return {
            transaction: payment.transaction,
            payment,
            receipt: receiptResult,
        };
    }
    async logDrawerEvent(dto) {
        const allowed = ['sale', 'no_sale', 'manager_override', 'change'];
        if (!allowed.includes(dto.reason)) {
            throw new common_1.BadRequestException(`Invalid drawer reason. Allowed: ${allowed.join(', ')}`);
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
        }
        catch { }
        return event;
    }
};
exports.CheckoutService = CheckoutService;
exports.CheckoutService = CheckoutService = CheckoutService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        printer_service_1.PrinterService,
        mpesa_service_1.MpesaService])
], CheckoutService);
//# sourceMappingURL=checkout.service.js.map
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsService = exports.ALL_STATUSES = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const ALLOWED_TRANSITIONS = {
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
exports.ALL_STATUSES = Object.keys(ALLOWED_TRANSITIONS);
let TransactionsService = class TransactionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    assertValidStatus(status) {
        if (!exports.ALL_STATUSES.includes(status)) {
            throw new common_1.BadRequestException(`Invalid status '${status}'. Valid: ${exports.ALL_STATUSES.join(', ')}`);
        }
    }
    assertTransition(from, to) {
        this.assertValidStatus(to);
        if (from === to)
            return;
        const allowed = ALLOWED_TRANSITIONS[from];
        if (!allowed) {
            throw new common_1.BadRequestException(`Unknown current status '${from}'`);
        }
        if (!allowed.includes(to)) {
            throw new common_1.BadRequestException(`Illegal transition ${from} → ${to}. Allowed from ${from}: ${allowed.length ? allowed.join(', ') : '(terminal – no outgoing transitions)'}`);
        }
    }
    async create(dto) {
        const status = dto.status ?? 'DRAFT';
        this.assertValidStatus(status);
        if (status !== 'DRAFT' && status !== 'IN_PROGRESS') {
            throw new common_1.BadRequestException(`Transactions can only be created in DRAFT or IN_PROGRESS, got ${status}`);
        }
        const location = await this.prisma.location.findUnique({
            where: { id: dto.locationId },
        });
        if (!location)
            throw new common_1.NotFoundException(`Location ${dto.locationId} not found`);
        if (dto.registerId) {
            const reg = await this.prisma.register.findUnique({
                where: { id: dto.registerId },
            });
            if (!reg)
                throw new common_1.NotFoundException(`Register ${dto.registerId} not found`);
        }
        if (dto.cashierId) {
            const user = await this.prisma.user.findUnique({
                where: { id: dto.cashierId },
            });
            if (!user)
                throw new common_1.NotFoundException(`User (cashier) ${dto.cashierId} not found`);
        }
        if (dto.customerId) {
            const cust = await this.prisma.customer.findUnique({
                where: { id: dto.customerId },
            });
            if (!cust)
                throw new common_1.NotFoundException(`Customer ${dto.customerId} not found`);
        }
        const now = dto.createdAt ? new Date(dto.createdAt) : new Date();
        let subtotalCents = dto.subtotalCents ?? 0;
        let taxCents = dto.taxCents ?? 0;
        let totalCents = dto.totalCents ?? 0;
        let lineItemsToCreate = [];
        if (dto.lineItems && dto.lineItems.length > 0) {
            lineItemsToCreate = await Promise.all(dto.lineItems.map(async (li) => {
                const prod = await this.prisma.product.findUnique({
                    where: { id: li.productId },
                    include: { taxCategory: true },
                });
                if (!prod) {
                    throw new common_1.NotFoundException(`Product ${li.productId} not found`);
                }
                const unitPriceCents = li.unitPriceCents ?? prod.priceCents;
                const taxRateBp = li.taxRateBp ?? (prod.taxCategory?.rateBp ?? 0);
                const discountCents = li.discountCents ?? 0;
                const quantity = Number(li.quantity);
                const lineSubtotal = Math.round(unitPriceCents * quantity) - discountCents;
                const lineTax = Math.round((lineSubtotal * taxRateBp) / 10000);
                const lineTotal = li.lineTotalCents ?? (lineSubtotal + lineTax);
                return {
                    productId: li.productId,
                    quantity: li.quantity,
                    unitPriceCents,
                    unitCostCents: prod.costCents ?? null,
                    taxRateBp,
                    discountCents,
                    lineTotalCents: lineTotal,
                    lineSubtotal,
                    lineTax,
                };
            }));
            if (dto.subtotalCents === undefined) {
                subtotalCents = lineItemsToCreate.reduce((s, li) => s + li.lineSubtotal, 0);
            }
            if (dto.taxCents === undefined) {
                taxCents = lineItemsToCreate.reduce((s, li) => s + li.lineTax, 0);
            }
            if (dto.totalCents === undefined) {
                totalCents = subtotalCents + taxCents;
            }
        }
        try {
            const txId = dto.id ?? (0, crypto_1.randomUUID)();
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
                    lineItems: lineItemsToCreate.length > 0
                        ? {
                            create: lineItemsToCreate.map((li) => ({
                                productId: li.productId,
                                quantity: li.quantity,
                                unitPriceCents: li.unitPriceCents,
                                unitCostCents: li.unitCostCents,
                                taxRateBp: li.taxRateBp,
                                discountCents: li.discountCents,
                                lineTotalCents: li.lineTotalCents,
                            })),
                        }
                        : undefined,
                },
                include: { lineItems: true, payments: true },
            });
            return tx;
        }
        catch (e) {
            if (e.code === 'P2002') {
                throw new common_1.ConflictException(`Transaction with id ${dto.id} already exists (idempotent retry?)`);
            }
            if (e.code === 'P2003') {
                throw new common_1.BadRequestException(`Foreign key violation: ${e.message}`);
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
    async findOne(id) {
        const tx = await this.prisma.transaction.findUnique({
            where: { id },
            include: { lineItems: { include: { product: true } }, payments: true },
        });
        if (!tx)
            throw new common_1.NotFoundException(`Transaction ${id} not found`);
        return tx;
    }
    async update(id, dto) {
        const existing = await this.findOne(id);
        if (dto.lineItems &&
            ['COMPLETED', 'REFUNDED', 'VOIDED'].includes(existing.status)) {
            throw new common_1.BadRequestException(`Line items are immutable once transaction is ${existing.status}`);
        }
        if (dto.status) {
            this.assertTransition(existing.status, dto.status);
        }
        const newStatus = dto.status ?? existing.status;
        if (dto.lineItems) {
            const costByProductId = new Map();
            for (const li of dto.lineItems) {
                const prod = await this.prisma.product.findUnique({
                    where: { id: li.productId },
                });
                if (!prod)
                    throw new common_1.NotFoundException(`Product ${li.productId} not found`);
                costByProductId.set(li.productId, prod.costCents ?? null);
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
                    include: { lineItems: true, payments: true },
                });
                return updated;
            });
        }
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
    async remove(id) {
        await this.findOne(id);
        await this.prisma.transaction.delete({ where: { id } });
        return { deleted: true, id };
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map
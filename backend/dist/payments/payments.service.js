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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PaymentsService = class PaymentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const tx = await this.prisma.transaction.findUnique({
            where: { id: dto.transactionId },
        });
        if (!tx)
            throw new common_1.NotFoundException(`Transaction ${dto.transactionId} not found`);
        if (!Number.isInteger(dto.amountCents) || dto.amountCents < 0) {
            throw new common_1.BadRequestException('amountCents must be a non-negative integer (cents)');
        }
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
    async findAll(transactionId) {
        const where = {};
        if (transactionId)
            where.transactionId = transactionId;
        return this.prisma.payment.findMany({
            where,
            orderBy: { id: 'asc' },
        });
    }
    async findOne(id) {
        const p = await this.prisma.payment.findUnique({ where: { id } });
        if (!p)
            throw new common_1.NotFoundException(`Payment ${id} not found`);
        return p;
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map
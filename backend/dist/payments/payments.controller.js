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
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const payments_service_1 = require("./payments.service");
const mpesa_service_1 = require("./mpesa.service");
const create_payment_dto_1 = require("./dto/create-payment.dto");
const stk_push_dto_1 = require("./dto/stk-push.dto");
const till_payment_dto_1 = require("./dto/till-payment.dto");
let PaymentsController = class PaymentsController {
    service;
    mpesa;
    constructor(service, mpesa) {
        this.service = service;
        this.mpesa = mpesa;
    }
    create(dto) {
        return this.service.create(dto);
    }
    findAll(transactionId) {
        return this.service.findAll(transactionId);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    getStatus(id) {
        return this.mpesa.getPaymentStatus(id);
    }
    async stkPush(dto) {
        return this.mpesa.initiateSTKPush(dto.transactionId, dto.phoneNumber, dto.amountCents);
    }
    async mpesaCallback(body) {
        return this.mpesa.handleCallback(body);
    }
    async tillPayment(dto) {
        return this.mpesa.createTillPayment(dto.transactionId, dto.mpesaCode, dto.amountCents);
    }
    async reconcile(paymentId) {
        return this.mpesa.reconcileTillPayment(paymentId);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_payment_dto_1.CreatePaymentDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('transactionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('status/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('mpesa/stk-push'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [stk_push_dto_1.StkPushDto]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "stkPush", null);
__decorate([
    (0, common_1.Post)('mpesa/callback'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "mpesaCallback", null);
__decorate([
    (0, common_1.Post)('mpesa/till'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [till_payment_dto_1.TillPaymentDto]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "tillPayment", null);
__decorate([
    (0, common_1.Post)('mpesa/reconcile/:paymentId'),
    __param(0, (0, common_1.Param)('paymentId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "reconcile", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService,
        mpesa_service_1.MpesaService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map
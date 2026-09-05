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
exports.CheckoutController = void 0;
const common_1 = require("@nestjs/common");
const checkout_service_1 = require("./checkout.service");
const cash_sale_dto_1 = require("./dto/cash-sale.dto");
const mpesa_stk_sale_dto_1 = require("./dto/mpesa-stk-sale.dto");
const mpesa_till_sale_dto_1 = require("./dto/mpesa-till-sale.dto");
let CheckoutController = class CheckoutController {
    service;
    constructor(service) {
        this.service = service;
    }
    cashSale(dto) {
        return this.service.cashSale(dto);
    }
    mpesaStkSale(dto) {
        return this.service.mpesaStkSale(dto);
    }
    mpesaTillSale(dto) {
        return this.service.mpesaTillSale(dto);
    }
    completeMpesaSale(paymentId) {
        return this.service.completeMpesaSale(paymentId);
    }
    openDrawer(dto) {
        return this.service.logDrawerEvent(dto);
    }
};
exports.CheckoutController = CheckoutController;
__decorate([
    (0, common_1.Post)('cash'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cash_sale_dto_1.CashSaleDto]),
    __metadata("design:returntype", void 0)
], CheckoutController.prototype, "cashSale", null);
__decorate([
    (0, common_1.Post)('mpesa-stk'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mpesa_stk_sale_dto_1.MpesaStkSaleDto]),
    __metadata("design:returntype", void 0)
], CheckoutController.prototype, "mpesaStkSale", null);
__decorate([
    (0, common_1.Post)('mpesa-till'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mpesa_till_sale_dto_1.MpesaTillSaleDto]),
    __metadata("design:returntype", void 0)
], CheckoutController.prototype, "mpesaTillSale", null);
__decorate([
    (0, common_1.Post)('mpesa-complete/:paymentId'),
    __param(0, (0, common_1.Param)('paymentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CheckoutController.prototype, "completeMpesaSale", null);
__decorate([
    (0, common_1.Post)('drawer/open'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CheckoutController.prototype, "openDrawer", null);
exports.CheckoutController = CheckoutController = __decorate([
    (0, common_1.Controller)('checkout'),
    __metadata("design:paramtypes", [checkout_service_1.CheckoutService])
], CheckoutController);
//# sourceMappingURL=checkout.controller.js.map
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
exports.TaxCategoriesController = void 0;
const common_1 = require("@nestjs/common");
const tax_categories_service_1 = require("./tax-categories.service");
const create_tax_category_dto_1 = require("./dto/create-tax-category.dto");
const update_tax_category_dto_1 = require("./dto/update-tax-category.dto");
const calculate_tax_dto_1 = require("./dto/calculate-tax.dto");
let TaxCategoriesController = class TaxCategoriesController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(dto) {
        return this.service.create(dto);
    }
    calculate(dto) {
        return this.service.calculateTax(dto);
    }
    seedStandard() {
        return this.service.seedStandardCategories();
    }
    findAll() {
        return this.service.findAll();
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    update(id, dto) {
        return this.service.update(id, dto);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
exports.TaxCategoriesController = TaxCategoriesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_tax_category_dto_1.CreateTaxCategoryDto]),
    __metadata("design:returntype", void 0)
], TaxCategoriesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('calculate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [calculate_tax_dto_1.CalculateTaxDto]),
    __metadata("design:returntype", void 0)
], TaxCategoriesController.prototype, "calculate", null);
__decorate([
    (0, common_1.Post)('seed-standard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TaxCategoriesController.prototype, "seedStandard", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TaxCategoriesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TaxCategoriesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_tax_category_dto_1.UpdateTaxCategoryDto]),
    __metadata("design:returntype", void 0)
], TaxCategoriesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TaxCategoriesController.prototype, "remove", null);
exports.TaxCategoriesController = TaxCategoriesController = __decorate([
    (0, common_1.Controller)('tax-categories'),
    __metadata("design:paramtypes", [tax_categories_service_1.TaxCategoriesService])
], TaxCategoriesController);
//# sourceMappingURL=tax-categories.controller.js.map
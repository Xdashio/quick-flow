"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaxCategoriesModule = void 0;
const common_1 = require("@nestjs/common");
const tax_categories_service_1 = require("./tax-categories.service");
const tax_categories_controller_1 = require("./tax-categories.controller");
let TaxCategoriesModule = class TaxCategoriesModule {
};
exports.TaxCategoriesModule = TaxCategoriesModule;
exports.TaxCategoriesModule = TaxCategoriesModule = __decorate([
    (0, common_1.Module)({
        controllers: [tax_categories_controller_1.TaxCategoriesController],
        providers: [tax_categories_service_1.TaxCategoriesService],
        exports: [tax_categories_service_1.TaxCategoriesService],
    })
], TaxCategoriesModule);
//# sourceMappingURL=tax-categories.module.js.map
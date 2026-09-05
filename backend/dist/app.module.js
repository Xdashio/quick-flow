"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const products_module_1 = require("./products/products.module");
const tax_categories_module_1 = require("./tax-categories/tax-categories.module");
const transactions_module_1 = require("./transactions/transactions.module");
const inventory_module_1 = require("./inventory/inventory.module");
const payments_module_1 = require("./payments/payments.module");
const drawer_events_module_1 = require("./drawer-events/drawer-events.module");
const hardware_module_1 = require("./hardware/hardware.module");
const checkout_module_1 = require("./checkout/checkout.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const reports_module_1 = require("./reports/reports.module");
const images_module_1 = require("./images/images.module");
const categories_module_1 = require("./categories/categories.module");
const locations_module_1 = require("./locations/locations.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, envFilePath: ['backend/.env', '.env'] }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            reports_module_1.ReportsModule,
            products_module_1.ProductsModule,
            tax_categories_module_1.TaxCategoriesModule,
            categories_module_1.CategoriesModule,
            transactions_module_1.TransactionsModule,
            inventory_module_1.InventoryModule,
            payments_module_1.PaymentsModule,
            drawer_events_module_1.DrawerEventsModule,
            hardware_module_1.HardwareModule,
            checkout_module_1.CheckoutModule,
            images_module_1.ImagesModule,
            locations_module_1.LocationsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
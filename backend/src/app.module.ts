import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { TaxCategoriesModule } from './tax-categories/tax-categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { InventoryModule } from './inventory/inventory.module';
import { PaymentsModule } from './payments/payments.module';
import { DrawerEventsModule } from './drawer-events/drawer-events.module';
import { HardwareModule } from './hardware/hardware.module';
import { CheckoutModule } from './checkout/checkout.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ReportsModule } from './reports/reports.module';
import { ImagesModule } from './images/images.module';
import { CategoriesModule } from './categories/categories.module';
import { LocationsModule } from './locations/locations.module';

@Module({
  imports: [
    // Works regardless of cwd: repo root (`npm run dev:backend`) uses
    // `backend/.env`; running inside `backend/` uses `.env`. Railway/hosting
    // env vars always take precedence over either file, so local Supabase
    // DATABASE_URL and prod Postgres DATABASE_URL coexist without code changes.
    // Same for R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY /
    // R2_BUCKET / R2_PUBLIC_URL — set them in backend/.env locally AND as
    // Railway env vars in prod. Secrets never leave the server: only the
    // presigned uploadUrl + object key are sent to the browser.
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['backend/.env', '.env'] }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ReportsModule,
    ProductsModule,
    TaxCategoriesModule,
    CategoriesModule,
    TransactionsModule,
    InventoryModule,
    PaymentsModule,
    DrawerEventsModule,
    HardwareModule,
    CheckoutModule,
    ImagesModule,
    LocationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
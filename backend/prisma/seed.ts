import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL not set in backend/.env');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('[Seed] Seeding Kenya tax categories...');

  // 1. Seed canonical tax categories
  const standard = await prisma.taxCategory.upsert({
    where: { id: '33333333-3333-3333-3333-333333333333' },
    update: { name: 'standard', rateBp: 1600 },
    create: {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'standard',
      rateBp: 1600,
    },
  });

  const zeroRated = await prisma.taxCategory.upsert({
    where: { id: '44444444-4444-4444-4444-444444444444' },
    update: { name: 'zero-rated', rateBp: 0 },
    create: {
      id: '44444444-4444-4444-4444-444444444444',
      name: 'zero-rated',
      rateBp: 0,
    },
  });

  const exempt = await prisma.taxCategory.upsert({
    where: { id: '55555555-5555-5555-5555-555555555555' },
    update: { name: 'exempt', rateBp: 0 },
    create: {
      id: '55555555-5555-5555-5555-555555555555',
      name: 'exempt',
      rateBp: 0,
    },
  });

  console.log(`[Seed] Tax categories ready:`);
  console.log(` - Standard (16%): ${standard.id} [${standard.rateBp}bp]`);
  console.log(` - Zero-rated (0%): ${zeroRated.id} [${zeroRated.rateBp}bp]`);
  console.log(` - Exempt (0%): ${exempt.id} [${exempt.rateBp}bp]`);

  // 2. Ensure products are linked to valid tax categories
  // Products with 'Bread', 'Maize', 'Flour', 'Milk', 'Sugar' -> zero-rated / exempt
  // Products with 'Juice', 'Tusker', 'Soda', other standard -> standard 16%
  const allProducts = await prisma.product.findMany();
  for (const prod of allProducts) {
    const nameLower = prod.name.toLowerCase();
    let targetCat = standard.id;
    if (nameLower.includes('flour') || nameLower.includes('sugar') || nameLower.includes('milk')) {
      targetCat = zeroRated.id;
    } else if (nameLower.includes('bread') || nameLower.includes('tomato')) {
      targetCat = exempt.id;
    }
    await prisma.product.update({
      where: { id: prod.id },
      data: { taxCategoryId: targetCat },
    });
  }

  console.log(`[Seed] Updated ${allProducts.length} products with canonical Kenya tax categories.`);

  // 3. Seed default store location & register
  const location = await prisma.location.upsert({
    where: { id: '11111111-1111-1111-1111-111111111111' },
    update: { name: 'Main Store - Nairobi CBD' },
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Main Store - Nairobi CBD',
      address: 'Kenyatta Avenue, Nairobi',
    },
  });

  await prisma.register.upsert({
    where: { id: '22222222-2222-2222-2222-222222222222' },
    update: { name: 'POS Terminal 1', locationId: location.id },
    create: {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'POS Terminal 1',
      locationId: location.id,
    },
  });

  // 4. Seed default Admin/Manager account (username: admin, password: password123)
  const bcrypt = await import('bcryptjs');
  const pinHash = await bcrypt.default.hash('password123', 10);
  const adminUser = await prisma.user.upsert({
    where: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
    update: { name: 'admin', role: 'admin', active: true, pinHash },
    create: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'admin',
      role: 'admin',
      active: true,
      pinHash,
    },
  });
  console.log(`[Seed] Admin user ready: '${adminUser.name}' (password: password123)`);

  // 5. Seed sample Kenya retail products if empty
  if (allProducts.length === 0) {
    const sampleProducts = [
      { sku: 'UNGA-001', barcode: '616110000001', name: 'Jogoo Maize Flour 2kg', priceCents: 18000, taxCategoryId: zeroRated.id },
      { sku: 'MILK-002', barcode: '616110000002', name: 'Brookside Fresh Milk 500ml', priceCents: 6500, taxCategoryId: zeroRated.id },
      { sku: 'BRD-003', barcode: '616110000003', name: 'Festive White Bread 400g', priceCents: 6500, taxCategoryId: exempt.id },
      { sku: 'SODA-004', barcode: '616110000004', name: 'Coca-Cola 500ml PET', priceCents: 8000, taxCategoryId: standard.id },
      { sku: 'SUG-005', barcode: '616110000005', name: 'Kabras Sugar 1kg', priceCents: 16000, taxCategoryId: zeroRated.id },
      { sku: 'OIL-006', barcode: '616110000006', name: 'Rina Cooking Oil 1L', priceCents: 29000, taxCategoryId: standard.id },
    ];
    for (const p of sampleProducts) {
      await prisma.product.upsert({
        where: { sku: p.sku },
        update: {},
        create: {
          sku: p.sku,
          barcode: p.barcode,
          name: p.name,
          priceCents: p.priceCents,
          taxCategoryId: p.taxCategoryId,
          unitType: 'each',
          active: true,
        },
      });
    }
    console.log(`[Seed] Seeded ${sampleProducts.length} sample Kenya retail items.`);
  }
}

main()
  .catch((e) => {
    console.error('[Seed] Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

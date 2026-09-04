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
  console.log('[Seed] Seeding Kenya tax categories per blueprint §2.3...');

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
}

main()
  .catch((e) => {
    console.error('[Seed] Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import path from 'path';
import dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL not set in backend/.env');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('[Seed] Starting POS database seeding...');

  // 1. Canonical Kenya tax categories
  const standard = await prisma.taxCategory.upsert({
    where: { id: '33333333-3333-4333-8333-333333333333' },
    update: { name: 'Standard (16%)', rateBp: 1600 },
    create: {
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Standard (16%)',
      rateBp: 1600,
    },
  });

  const zeroRated = await prisma.taxCategory.upsert({
    where: { id: '44444444-4444-4444-8444-444444444444' },
    update: { name: 'Zero-Rated (0%)', rateBp: 0 },
    create: {
      id: '44444444-4444-4444-8444-444444444444',
      name: 'Zero-Rated (0%)',
      rateBp: 0,
    },
  });

  const exempt = await prisma.taxCategory.upsert({
    where: { id: '55555555-5555-5555-8555-555555555555' },
    update: { name: 'Exempt (0%)', rateBp: 0 },
    create: {
      id: '55555555-5555-5555-8555-555555555555',
      name: 'Exempt (0%)',
      rateBp: 0,
    },
  });

  console.log('[Seed] Tax categories synced.');

  // 2. Default Store Location & Register
  const location = await prisma.location.upsert({
    where: { id: '11111111-1111-1111-8111-111111111111' },
    update: { name: 'Main Store - Nairobi CBD', address: 'Kenyatta Avenue, Nairobi' },
    create: {
      id: '11111111-1111-1111-8111-111111111111',
      name: 'Main Store - Nairobi CBD',
      address: 'Kenyatta Avenue, Nairobi',
    },
  });

  const register = await prisma.register.upsert({
    where: { id: '22222222-2222-2222-8222-222222222222' },
    update: { name: 'POS Terminal 1', locationId: location.id },
    create: {
      id: '22222222-2222-2222-8222-222222222222',
      name: 'POS Terminal 1',
      locationId: location.id,
    },
  });

  console.log(`[Seed] Location (${location.name}) & Register (${register.name}) synced.`);

  // 3. Admin User account: username: admin, password: @QF_admin<^>
  const adminPassword = '@QF_admin<^>';
  const pinHash = await bcrypt.hash(adminPassword, 10);
  const adminUser = await prisma.user.upsert({
    where: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
    update: { name: 'admin', role: 'admin', active: true, pinHash },
    create: {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      name: 'admin',
      role: 'admin',
      active: true,
      pinHash,
    },
  });
  console.log(`[Seed] Admin user synced: '${adminUser.name}' (role: ${adminUser.role})`);

  // 4. Product Categories
  const categoriesData = [
    { id: 'c1111111-1111-4111-8111-111111111111', name: 'Groceries & Staples' },
    { id: 'c2222222-2222-4222-8222-222222222222', name: 'Beverages & Soft Drinks' },
    { id: 'c3333333-3333-4333-8333-333333333333', name: 'Dairy & Bakery' },
    { id: 'c4444444-4444-4444-8444-444444444444', name: 'Snacks & Confectionery' },
    { id: 'c5555555-5555-4555-8555-555555555555', name: 'Personal Care & Household' },
    { id: 'c6666666-6666-4666-8666-666666666666', name: 'Fresh Produce' },
  ];

  const catMap = new Map<string, string>();
  for (const c of categoriesData) {
    const cat = await prisma.productCategory.upsert({
      where: { id: c.id },
      update: { name: c.name },
      create: { id: c.id, name: c.name },
    });
    catMap.set(c.name, cat.id);
  }
  console.log(`[Seed] Synced ${categoriesData.length} product categories.`);

  // 5. Clean, Real Products with High Quality Images & Metadata
  const products = [
    // ── Groceries & Staples ──
    {
      sku: 'UNG-JOG-2KG',
      barcode: '616110000101',
      name: 'Jogoo Maize Flour 2kg',
      description: 'Premium sifted maize meal for family ugali',
      categoryId: catMap.get('Groceries & Staples')!,
      taxCategoryId: zeroRated.id,
      priceCents: 18500, // KES 185.00
      costCents: 15500,  // KES 155.00
      reorderPoint: 20,
      unitType: 'each',
      isWeighed: false,
      imageKey: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
    },
    {
      sku: 'SUG-KAB-1KG',
      barcode: '616110000102',
      name: 'Kabras Pure White Sugar 1kg',
      description: 'Locally milled premium sweet cane sugar',
      categoryId: catMap.get('Groceries & Staples')!,
      taxCategoryId: zeroRated.id,
      priceCents: 16000, // KES 160.00
      costCents: 13500,  // KES 135.00
      reorderPoint: 25,
      unitType: 'each',
      isWeighed: false,
      imageKey: 'https://images.unsplash.com/photo-1622484217112-9cbb8aa40ad6?w=600&auto=format&fit=crop&q=80',
    },
    {
      sku: 'OIL-RIN-1L',
      barcode: '616110000103',
      name: 'Rina Pure Vegetable Cooking Oil 1L',
      description: 'Triple refined vegetable oil for everyday cooking',
      categoryId: catMap.get('Groceries & Staples')!,
      taxCategoryId: standard.id,
      priceCents: 29500, // KES 295.00
      costCents: 24500,  // KES 245.00
      reorderPoint: 15,
      unitType: 'each',
      isWeighed: false,
      imageKey: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
    },
    {
      sku: 'RIC-DAW-2KG',
      barcode: '616110000104',
      name: 'Daawat Long Grain Aromatic Rice 2kg',
      description: 'Finest aromatic long-grain white rice',
      categoryId: catMap.get('Groceries & Staples')!,
      taxCategoryId: zeroRated.id,
      priceCents: 45000, // KES 450.00
      costCents: 38000,  // KES 380.00
      reorderPoint: 15,
      unitType: 'each',
      isWeighed: false,
      imageKey: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
    },
    {
      sku: 'SLT-KEN-1KG',
      barcode: '616110000105',
      name: 'Kensalt Iodised Table Salt 1kg',
      description: 'Vacuum refined iodated table salt',
      categoryId: catMap.get('Groceries & Staples')!,
      taxCategoryId: standard.id,
      priceCents: 4500, // KES 45.00
      costCents: 3200,  // KES 32.00
      reorderPoint: 50,
      unitType: 'each',
      isWeighed: false,
      imageKey: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=600&auto=format&fit=crop&q=80',
    },

    // ── Beverages & Soft Drinks ──
    {
      sku: 'BEV-COK-500ML',
      barcode: '616110000201',
      name: 'Coca-Cola Original 500ml PET',
      description: 'Refreshing classic sparkling cola drink',
      categoryId: catMap.get('Beverages & Soft Drinks')!,
      taxCategoryId: standard.id,
      priceCents: 8000, // KES 80.00
      costCents: 6200,  // KES 62.00
      reorderPoint: 40,
      unitType: 'each',
      isWeighed: false,
      imageKey: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
    },
    {
      sku: 'BEV-SPR-500ML',
      barcode: '616110000202',
      name: 'Sprite Lemon-Lime 500ml PET',
      description: 'Crisp, clean lemon-lime sparkling soda',
      categoryId: catMap.get('Beverages & Soft Drinks')!,
      taxCategoryId: standard.id,
      priceCents: 8000, // KES 80.00
      costCents: 6200,  // KES 62.00
      reorderPoint: 30,
      unitType: 'each',
      isWeighed: false,
      imageKey: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=600&auto=format&fit=crop&q=80',
    },
    {
      sku: 'BEV-MIN-1L',
      barcode: '616110000203',
      name: 'Minute Maid Tropical Blend 1L',
      description: '100% refreshing tropical fruit juice blend with pulps',
      categoryId: catMap.get('Beverages & Soft Drinks')!,
      taxCategoryId: standard.id,
      priceCents: 20000, // KES 200.00
      costCents: 16000,  // KES 160.00
      reorderPoint: 20,
      unitType: 'each',
      isWeighed: false,
      imageKey: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80',
    },
    {
      sku: 'BEV-KER-TEA-250G',
      barcode: '616110000204',
      name: 'Kericho Gold Pure Kenyan Tea 250g',
      description: 'Premium rich black tea leaves from the Kenyan highlands',
      categoryId: catMap.get('Beverages & Soft Drinks')!,
      taxCategoryId: standard.id,
      priceCents: 22000, // KES 220.00
      costCents: 17500,  // KES 175.00
      reorderPoint: 20,
      unitType: 'each',
      isWeighed: false,
      imageKey: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
    },
    {
      sku: 'BEV-WTR-KER-1L',
      barcode: '616110000205',
      name: 'Keringet Pure Natural Still Water 1L',
      description: 'Naturally purified still mineral drinking water',
      categoryId: catMap.get('Beverages & Soft Drinks')!,
      taxCategoryId: standard.id,
      priceCents: 9000, // KES 90.00
      costCents: 6000,  // KES 60.00
      reorderPoint: 50,
      unitType: 'each',
      isWeighed: false,
      imageKey: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80',
    },

    // ── Dairy & Bakery ──
    {
      sku: 'DRY-BRK-500ML',
      barcode: '616110000301',
      name: 'Brookside Homogenised Fresh Milk 500ml',
      description: 'Pasteurised whole fresh dairy milk pouch',
      categoryId: catMap.get('Dairy & Bakery')!,
      taxCategoryId: zeroRated.id,
      priceCents: 6500, // KES 65.00
      costCents: 5400,  // KES 54.00
      reorderPoint: 35,
      unitType: 'each',
      isWeighed: false,
      imageKey: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
    },
    {
      sku: 'BKY-FES-400G',
      barcode: '616110000302',
      name: 'Festive Sliced White Bread 400g',
      description: 'Soft and oven-fresh sliced white sandwich loaf',
      categoryId: catMap.get('Dairy & Bakery')!,
      taxCategoryId: exempt.id,
      priceCents: 6500, // KES 65.00
      costCents: 5200,  // KES 52.00
      reorderPoint: 25,
      unitType: 'each',
      isWeighed: false,
      imageKey: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    },
    {
      sku: 'DRY-BLU-500G',
      barcode: '616110000303',
      name: 'Blue Band Original Margarine Tub 500g',
      description: 'Fortified enriched vitamin table spread',
      categoryId: catMap.get('Dairy & Bakery')!,
      taxCategoryId: standard.id,
      priceCents: 26000, // KES 260.00
      costCents: 21500,  // KES 215.00
      reorderPoint: 15,
      unitType: 'each',
      isWeighed: false,
      imageKey: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80',
    },
    {
      sku: 'DRY-ILA-YOG-500ML',
      barcode: '616110000304',
      name: 'Ilara Strawberry Creamy Yoghurt 500ml',
      description: 'Delicious probiotic thick drinking fruit yoghurt',
      categoryId: catMap.get('Dairy & Bakery')!,
      taxCategoryId: standard.id,
      priceCents: 13000, // KES 130.00
      costCents: 10200,  // KES 102.00
      reorderPoint: 20,
      unitType: 'each',
      isWeighed: false,
      imageKey: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80',
    },

    // ── Snacks & Confectionery ──
    {
      sku: 'SNK-URB-120G',
      barcode: '616110000401',
      name: 'Urban Bites Sweet Chilli Potato Crisps 120g',
      description: 'Crispy wave-cut potato chips with sweet chilli seasoning',
      categoryId: catMap.get('Snacks & Confectionery')!,
      taxCategoryId: standard.id,
      priceCents: 15000, // KES 150.00
      costCents: 11500,  // KES 115.00
      reorderPoint: 20,
      unitType: 'each',
      isWeighed: false,
      imageKey: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80',
    },
    {
      sku: 'SNK-CAD-80G',
      barcode: '616110000402',
      name: 'Cadbury Dairy Milk Chocolate Bar 80g',
      description: 'Rich and creamy milk chocolate slab',
      categoryId: catMap.get('Snacks & Confectionery')!,
      taxCategoryId: standard.id,
      priceCents: 18000, // KES 180.00
      costCents: 14000,  // KES 140.00
      reorderPoint: 25,
      unitType: 'each',
      isWeighed: false,
      imageKey: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
    },
    {
      sku: 'SNK-DIG-200G',
      barcode: '616110000403',
      name: 'McVities Original Digestive Biscuits 200g',
      description: 'Wholesome wheat meal crumbly crunchy biscuits',
      categoryId: catMap.get('Snacks & Confectionery')!,
      taxCategoryId: standard.id,
      priceCents: 14000, // KES 140.00
      costCents: 10500,  // KES 105.00
      reorderPoint: 30,
      unitType: 'each',
      isWeighed: false,
      imageKey: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80',
    },

    // ── Personal Care & Household ──
    {
      sku: 'HSD-OMO-1KG',
      barcode: '616110000501',
      name: 'Omo Handwash Washing Powder 1kg',
      description: 'Tough stain removal laundry detergent with freshness',
      categoryId: catMap.get('Personal Care & Household')!,
      taxCategoryId: standard.id,
      priceCents: 34000, // KES 340.00
      costCents: 28000,  // KES 280.00
      reorderPoint: 15,
      unitType: 'each',
      isWeighed: false,
      imageKey: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=600&auto=format&fit=crop&q=80',
    },
    {
      sku: 'HSD-GEI-200G',
      barcode: '616110000502',
      name: 'Geisha Aloe Vera Beauty Bathing Soap 200g',
      description: 'Long-lasting nourishing bathing soap bar',
      categoryId: catMap.get('Personal Care & Household')!,
      taxCategoryId: standard.id,
      priceCents: 12000, // KES 120.00
      costCents: 9000,   // KES 90.00
      reorderPoint: 40,
      unitType: 'each',
      isWeighed: false,
      imageKey: 'https://images.unsplash.com/photo-1607006314144-88db01869e54?w=600&auto=format&fit=crop&q=80',
    },
    {
      sku: 'HSD-COL-140G',
      barcode: '616110000503',
      name: 'Colgate Maximum Cavity Protection 140g',
      description: 'Anti-cavity fluoride fresh mint toothpaste',
      categoryId: catMap.get('Personal Care & Household')!,
      taxCategoryId: standard.id,
      priceCents: 19000, // KES 190.00
      costCents: 14500,  // KES 145.00
      reorderPoint: 25,
      unitType: 'each',
      isWeighed: false,
      imageKey: 'https://images.unsplash.com/photo-1559591937-e1069634e29b?w=600&auto=format&fit=crop&q=80',
    },

    // ── Fresh Produce (Weighed / Each) ──
    {
      sku: 'FRS-TOM-1KG',
      barcode: '616110000601',
      name: 'Fresh Ripe Salad Tomatoes (kg)',
      description: 'Farm-fresh plump and juicy salad tomatoes',
      categoryId: catMap.get('Fresh Produce')!,
      taxCategoryId: exempt.id,
      priceCents: 12000, // KES 120.00 / kg
      costCents: 8500,   // KES 85.00 / kg
      reorderPoint: 10,
      unitType: 'kg',
      isWeighed: true,
      imageKey: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
    },
    {
      sku: 'FRS-ONI-1KG',
      barcode: '616110000602',
      name: 'Dry Red Onions (kg)',
      description: 'Locally grown pungent dry red cooking onions',
      categoryId: catMap.get('Fresh Produce')!,
      taxCategoryId: exempt.id,
      priceCents: 15000, // KES 150.00 / kg
      costCents: 11000,  // KES 110.00 / kg
      reorderPoint: 15,
      unitType: 'kg',
      isWeighed: true,
      imageKey: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        barcode: p.barcode,
        name: p.name,
        description: p.description,
        categoryId: p.categoryId,
        taxCategoryId: p.taxCategoryId,
        priceCents: p.priceCents,
        costCents: p.costCents,
        reorderPoint: p.reorderPoint,
        unitType: p.unitType,
        isWeighed: p.isWeighed,
        imageKey: p.imageKey,
        active: true,
      },
      create: {
        sku: p.sku,
        barcode: p.barcode,
        name: p.name,
        description: p.description,
        categoryId: p.categoryId,
        taxCategoryId: p.taxCategoryId,
        priceCents: p.priceCents,
        costCents: p.costCents,
        reorderPoint: p.reorderPoint,
        unitType: p.unitType,
        isWeighed: p.isWeighed,
        imageKey: p.imageKey,
        active: true,
      },
    });
  }

  console.log(`[Seed] Seeded ${products.length} clean, realistic products with images and metadata.`);
  console.log('[Seed] Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('[Seed] Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

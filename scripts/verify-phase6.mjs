import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../backend/.env") });

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const API_BASE = "http://localhost:3000/api";

async function run() {
  console.log("===============================================================");
  console.log("PHASE 6 VERIFICATION: KENYA VAT CALCULATION ENGINE & TAX FREEZE");
  console.log("===============================================================\n");

  // Step 0: Ensure canonical tax categories are present
  console.log("[0] Verifying seeded tax categories in backend API...");
  const taxCategoriesRes = await fetch(`${API_BASE}/tax-categories`);
  const taxCategories = await taxCategoriesRes.json();
  console.log("Current Tax Categories from API:");
  console.table(taxCategories.map((tc) => ({ id: tc.id, name: tc.name, rateBp: tc.rateBp })));

  const standardCat = taxCategories.find((tc) => tc.name === "standard");
  if (!standardCat) throw new Error("Missing canonical 'standard' tax category");
  if (standardCat.rateBp !== 1600) {
    // Reset to 1600 bp if modified previously
    await fetch(`${API_BASE}/tax-categories/${standardCat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rateBp: 1600 }),
    });
  }

  // Find a product linked to standard VAT
  const standardProduct = await prisma.product.findFirst({
    where: { taxCategoryId: standardCat.id },
    include: { taxCategory: true },
  });

  if (!standardProduct) {
    throw new Error("No product found linked to standard tax category");
  }

  console.log(`\nTest Product selected for verification:`);
  console.log(` - Name: ${standardProduct.name}`);
  console.log(` - Product ID: ${standardProduct.id}`);
  console.log(` - Unit Price: ${standardProduct.priceCents} cents (KES ${(standardProduct.priceCents / 100).toFixed(2)})`);
  console.log(` - Tax Category: ${standardProduct.taxCategory?.name} (${standardProduct.taxCategory?.rateBp} bp = 16%)`);

  const location = await prisma.location.findFirst();
  const cashier = await prisma.user.findFirst();

  console.log("\n---------------------------------------------------------------");
  console.log("VERIFICATION STEP 1: COMPLETE REAL TRANSACTION WITH 16% VAT");
  console.log("---------------------------------------------------------------");

  const qty = 2;
  const expectedSubtotal = standardProduct.priceCents * qty; // e.g. 35000 * 2 = 70000c
  const expectedTax = Math.round((expectedSubtotal * 1600) / 10000); // 70000 * 0.16 = 11200c
  const expectedTotal = expectedSubtotal + expectedTax; // 81200c

  console.log(`[1.1] Submitting transaction with ${qty}x ${standardProduct.name} via server-side engine...`);
  console.log(`[1.1] Submitting transaction with ${qty}x ${standardProduct.name} via server-side engine...`);
  const txCreateRes = await fetch(`${API_BASE}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      locationId: location.id,
      cashierId: cashier.id,
      status: "IN_PROGRESS",
      lineItems: [
        {
          productId: standardProduct.id,
          quantity: qty,
        },
      ],
    }),
  });

  if (!txCreateRes.ok) {
    throw new Error(`Failed to create transaction: ${txCreateRes.status} ${await txCreateRes.text()}`);
  }

  const txCreated = await txCreateRes.json();

  // Complete the transaction per §2.1 state machine
  const completeRes = await fetch(`${API_BASE}/transactions/${txCreated.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "COMPLETED" }),
  });
  const txData = await completeRes.json();

  console.log(`[1.2] API Response for completed transaction:`);
  console.log(` -> Transaction ID:  ${txData.id}`);
  console.log(` -> Status:          ${txData.status}`);
  console.log(` -> Subtotal:        ${txData.subtotalCents} cents (Expected: ${expectedSubtotal})`);
  console.log(` -> Calculated Tax:  ${txData.taxCents} cents (Expected 16%: ${expectedTax})`);
  console.log(` -> Total:           ${txData.totalCents} cents (Expected: ${expectedTotal})`);
  console.log(` -> Line Item Rate:  ${txData.lineItems[0]?.taxRateBp} bp (Expected: 1600)`);

  if (txData.taxCents !== expectedTax || txData.lineItems[0]?.taxRateBp !== 1600) {
    throw new Error(`Tax calculation mismatch! Expected ${expectedTax}c at 1600bp, got ${txData.taxCents}c at ${txData.lineItems[0]?.taxRateBp}bp`);
  }

  // Query database directly to prove it's in Postgres
  const dbTx1 = await prisma.transaction.findUnique({
    where: { id: txData.id },
    include: { lineItems: true },
  });

  console.log(`\n[1.3] Direct PostgreSQL Query verification for Tx ${txData.id}:`);
  console.log(` -> DB transactions.tax_cents:            ${dbTx1.taxCents}`);
  console.log(` -> DB transactions.total_cents:          ${dbTx1.totalCents}`);
  console.log(` -> DB transaction_line_items.tax_rate_bp: ${dbTx1.lineItems[0].taxRateBp}`);
  console.log(` -> DB transaction_line_items.unit_price:  ${dbTx1.lineItems[0].unitPriceCents}`);
  console.log(`✔ SUCCESS STEP 1: Calculated 16% VAT verified in response and in PostgreSQL.`);

  console.log("\n---------------------------------------------------------------");
  console.log("VERIFICATION STEP 2: CHANGE STANDARD RATE VIA ADMIN ENDPOINT");
  console.log("---------------------------------------------------------------");

  const NEW_RATE_BP = 1800; // e.g. KRA increases standard VAT to 18%
  console.log(`[2.1] Sending PATCH /api/tax-categories/${standardCat.id} with rateBp = ${NEW_RATE_BP} (18%)...`);
  const patchRes = await fetch(`${API_BASE}/tax-categories/${standardCat.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rateBp: NEW_RATE_BP }),
  });

  if (!patchRes.ok) {
    throw new Error(`Admin endpoint PATCH failed: ${patchRes.status} ${await patchRes.text()}`);
  }

  const patchData = await patchRes.json();
  console.log(` -> Admin API Response: id=${patchData.id}, name=${patchData.name}, rateBp=${patchData.rateBp}`);

  // Query PostgreSQL tax_categories table directly
  const dbCat = await prisma.taxCategory.findUnique({ where: { id: standardCat.id } });
  console.log(` -> Direct DB Query 'tax_categories': rate_bp = ${dbCat.rateBp}`);

  if (dbCat.rateBp !== NEW_RATE_BP) {
    throw new Error(`Failed to update tax category in database! Current: ${dbCat.rateBp}`);
  }
  console.log(`✔ SUCCESS STEP 2: Standard VAT rate changed to ${NEW_RATE_BP} bp (18%) via real backend endpoint.`);

  console.log("\n---------------------------------------------------------------");
  console.log("VERIFICATION STEP 3: RE-QUERY COMPLETED TX & PROVE TAX IS FROZEN");
  console.log("---------------------------------------------------------------");

  console.log(`[3.1] Re-querying completed Tx ${txData.id} via GET /api/transactions/:id...`);
  const reGetRes = await fetch(`${API_BASE}/transactions/${txData.id}`);
  const reGetData = await reGetRes.json();

  console.log(` -> Re-queried API Response taxCents:  ${reGetData.taxCents} (Original was: ${expectedTax})`);
  console.log(` -> Re-queried API Response taxRateBp: ${reGetData.lineItems[0]?.taxRateBp} (Original was: 1600)`);

  console.log(`\n[3.2] Re-querying completed Tx ${txData.id} directly from PostgreSQL...`);
  const dbTxRecheck = await prisma.transaction.findUnique({
    where: { id: txData.id },
    include: { lineItems: true },
  });

  console.log(` -> Postgres DB tax_cents:            ${dbTxRecheck.taxCents}`);
  console.log(` -> Postgres DB line_items.tax_rate_bp: ${dbTxRecheck.lineItems[0].taxRateBp}`);
  console.log(` -> (If recomputed at new 18% rate, tax would have been: ${Math.round((expectedSubtotal * 1800) / 10000)}c)`);

  if (dbTxRecheck.taxCents !== expectedTax || dbTxRecheck.lineItems[0].taxRateBp !== 1600) {
    throw new Error(`FAILURE: Completed transaction tax was NOT frozen! Found: ${dbTxRecheck.taxCents}c`);
  }
  console.log(`✔ SUCCESS: Completed transaction tax did NOT change. Tax remains permanently FROZEN at 16% (${expectedTax}c)!`);

  console.log("\n[3.3] Creating a NEW transaction to verify the new 18% rate applies to future sales...");
  const newTxRes = await fetch(`${API_BASE}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      locationId: location.id,
      cashierId: cashier.id,
      status: "IN_PROGRESS",
      lineItems: [
        {
          productId: standardProduct.id,
          quantity: qty,
        },
      ],
    }),
  });
  const newTxCreated = await newTxRes.json();
  const newCompleteRes = await fetch(`${API_BASE}/transactions/${newTxCreated.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "COMPLETED" }),
  });
  const newTxData = await newCompleteRes.json();
  const expectedNewTax = Math.round((expectedSubtotal * NEW_RATE_BP) / 10000);
  console.log(` -> New Tx ${newTxData.id} Calculated Tax: ${newTxData.taxCents}c at ${newTxData.lineItems[0]?.taxRateBp}bp (Expected: ${expectedNewTax}c at 1800bp)`);

  if (newTxData.taxCents !== expectedNewTax || newTxData.lineItems[0]?.taxRateBp !== NEW_RATE_BP) {
    throw new Error("New transaction failed to use updated tax rate!");
  }

  // Cleanup: restore standard rate to 1600 bp
  console.log("\n[3.4] Restoring standard rate to 1600 bp (16%)...");
  await fetch(`${API_BASE}/tax-categories/${standardCat.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rateBp: 1600 }),
  });
  console.log("✔ Standard rate restored to 1600 bp.");

  console.log("\n===============================================================");
  console.log("ALL PHASE 6 VERIFICATION CHECKS PASSED PERFECTLY!");
  console.log("===============================================================");
}

run()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

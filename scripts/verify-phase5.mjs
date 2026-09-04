import Database from "better-sqlite3";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import path from "path";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";
import { spawn, execSync } from "child_process";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../backend/.env") });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const sqliteDbPath = path.resolve(__dirname, "../register/data/pos.db");

// Dynamically import CommonJS modules
const { default: CheckoutQueue } = await import(
  path.resolve(__dirname, "../register/electron/checkout-queue.cjs").replace(/\\/g, "/")
);
const { default: SyncService } = await import(
  path.resolve(__dirname, "../register/electron/sync-service.cjs").replace(/\\/g, "/")
);

async function waitForBackend(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Backend at ${url} did not respond within ${timeoutMs}ms`);
}

async function run() {
  console.log("===============================================================");
  console.log("PHASE 5 VERIFICATION: SYNC AGENT (OFFLINE-FIRST CORE)");
  console.log("===============================================================\n");

  const initialCount = await prisma.transaction.count();
  console.log(`[0] Baseline: Backend Postgres transaction count = ${initialCount}`);

  // Fetch real products from DB for transactions
  const testProducts = await prisma.product.findMany({ take: 3 });
  if (testProducts.length < 3) {
    throw new Error("Need at least 3 products in database to run verification");
  }

  const locationId = "61978774-9cec-4866-8cc4-9a27b4c23b98";
  const cashierId = "900f4564-5be0-4358-864d-f8ef96e75209";

  // Build 3 real transaction payloads with client-generated UUIDs
  const txPayloads = testProducts.map((p, idx) => {
    const txId = randomUUID();
    const qty = idx + 1;
    const unitPriceCents = p.priceCents;
    const subtotalCents = unitPriceCents * qty;
    const taxCents = Math.round((subtotalCents * 1600) / 10000); // 16% standard VAT
    const totalCents = subtotalCents + taxCents;
    const amountTenderedCents = Math.ceil(totalCents / 100) * 100 + 1000; // Exact/more cash

    return {
      id: txId,
      locationId,
      cashierId,
      subtotalCents,
      taxCents,
      totalCents,
      amountTenderedCents,
      lineItems: [
        {
          productId: p.id,
          productName: p.name,
          quantity: qty,
          unitPriceCents,
          lineTotalCents: subtotalCents,
          taxRateBp: 1600,
        },
      ],
      createdAt: new Date().toISOString(),
    };
  });

  console.log("\n---------------------------------------------------------------");
  console.log("STEP 1: GENUINELY DISABLE NETWORK ACCESS");
  console.log("---------------------------------------------------------------");

  // Genuinely kill the backend process listening on port 3000
  console.log("[1.1] Terminating backend process on port 3000 to drop network access...");
  try {
    execSync("pkill -9 -f 'node dist/main' || true");
  } catch {}

  await new Promise((r) => setTimeout(r, 1000));

  // Verify backend is genuinely unreachable at TCP level (no mock flag)
  let networkDownVerified = false;
  try {
    await fetch("http://localhost:3000/api/health", { signal: AbortSignal.timeout(1500) });
  } catch (err) {
    networkDownVerified = true;
    console.log(`[1.2] Network check confirmed down: ${err.message} (GENUINELY OFFLINE)`);
  }

  if (!networkDownVerified) {
    throw new Error("Failed to genuinely disconnect backend network!");
  }

  const checkoutQueue = new CheckoutQueue({
    apiUrl: "http://localhost:3000/api",
    dbPath: sqliteDbPath,
    virtualDir: path.resolve(__dirname, "../register/data/virtual-printer"),
  });

  console.log("\n[1.3] Executing 3 real cash sales on the register while OFFLINE...");
  for (let i = 0; i < txPayloads.length; i++) {
    const payload = txPayloads[i];
    console.log(` -> Submitting transaction #${i + 1} (UUID: ${payload.id}, Total: ${payload.totalCents}c)...`);
    const result = await checkoutQueue.completeCashSale(payload);
    console.log(`    Result: offline=${result.offline}, queued=${result.queued}, receiptBytes=${result.receipt?.bytesLength}, drawerKick=${result.drawerKick?.bytesHex}`);
  }

  // Verify SQLite pending_transactions table
  const sqlite = new Database(sqliteDbPath);
  const queuedRows = sqlite
    .prepare("SELECT id, status, created_at FROM pending_transactions WHERE status='pending_sync'")
    .all();

  console.log("\n[1.4] Local SQLite Inspection ('pending_transactions' table):");
  console.table(queuedRows);

  const testIds = new Set(txPayloads.map((p) => p.id));
  const ourQueued = queuedRows.filter((r) => testIds.has(r.id));

  if (ourQueued.length !== 3) {
    throw new Error(`Expected exactly 3 transactions with status 'pending_sync', found ${ourQueued.length}`);
  }
  console.log(`✔ SUCCESS: Exactly 3 real transactions queued locally with status 'pending_sync'.`);

  console.log("\n---------------------------------------------------------------");
  console.log("STEP 2: RE-ENABLE NETWORK & RUN SYNC AGENT");
  console.log("---------------------------------------------------------------");

  console.log("[2.1] Restarting backend process (re-enabling network)...");
  const backendProc = spawn("node", ["dist/main"], {
    cwd: path.resolve(__dirname, "../backend"),
    stdio: "inherit",
    detached: true,
  });
  backendProc.unref();

  console.log("[2.2] Waiting for backend to come online...");
  await waitForBackend("http://localhost:3000/api/health", 15000);
  console.log("✔ Backend is back ONLINE (real TCP connection restored).");

  console.log("\n[2.3] Sync agent connectivity probe & flush...");
  const syncService = new SyncService({
    apiUrl: "http://localhost:3000/api",
    dbPath: sqliteDbPath,
    checkoutQueue,
  });

  const isConnected = await syncService.checkConnectivity();
  console.log(`[SyncService] Active connectivity check: isConnected = ${isConnected}`);
  if (!isConnected) throw new Error("SyncService failed to detect restored network");

  console.log("[SyncService] Triggering sync() to push queued transactions & pull catalog...");
  const syncResult = await syncService.sync();
  console.log(`[SyncService] Sync finished: status=${syncResult.status}, pendingCount=${syncResult.pendingCount}, flushed=${syncResult.pendingFlush?.flushed}`);

  // Inspect SQLite status after sync
  const updatedRows = sqlite
    .prepare("SELECT id, status, created_at FROM pending_transactions WHERE id IN (?, ?, ?)")
    .all(txPayloads[0].id, txPayloads[1].id, txPayloads[2].id);

  console.log("\n[2.4] Local SQLite rows after sync:");
  console.table(updatedRows);

  for (const r of updatedRows) {
    if (r.status !== "synced") {
      throw new Error(`Transaction ${r.id} is not 'synced' in SQLite (status: ${r.status})`);
    }
  }

  // Inspect Backend Postgres Database
  const afterCount = await prisma.transaction.count();
  const newTxs = await prisma.transaction.findMany({
    where: { id: { in: txPayloads.map((p) => p.id) } },
    include: { payments: true, lineItems: true },
  });

  console.log(`\n[2.5] Postgres Database Verification:`);
  console.log(` -> Initial count: ${initialCount}`);
  console.log(` -> Current count: ${afterCount}`);
  console.log(` -> Net new rows:  ${afterCount - initialCount} (Expected: exactly 3)`);
  console.log(` -> Found transactions: ${newTxs.length}`);

  if (afterCount !== initialCount + 3 || newTxs.length !== 3) {
    throw new Error(`Database transaction count mismatch! Expected exactly 3 new rows, got ${afterCount - initialCount}`);
  }

  for (const tx of newTxs) {
    console.log(`    ✔ Tx ${tx.id} | status=${tx.status} | total=${tx.totalCents}c | payments=${tx.payments.length} (${tx.payments[0]?.method}) | lineItems=${tx.lineItems.length}`);
  }
  console.log("✔ SUCCESS: Exactly 3 new transaction rows landed in Postgres without duplication!");

  console.log("\n---------------------------------------------------------------");
  console.log("STEP 3: DELIBERATE RETRY & IDEMPOTENCY KEY DEDUPLICATION");
  console.log("---------------------------------------------------------------");

  console.log("[3.1] Attempting duplicate submission of the exact same 3 transactions to /checkout/cash...");
  for (const payload of txPayloads) {
    const sanitized = checkoutQueue.sanitizeForBackend(payload);
    const res = await fetch("http://localhost:3000/api/checkout/cash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sanitized),
    });

    const body = await res.text();
    console.log(` -> Resending UUID ${payload.id} => Status: ${res.status} (Conflict=${res.status === 409})`);
    console.log(`    Response: ${body}`);

    if (res.status !== 409) {
      throw new Error(`Expected HTTP 409 Conflict for duplicate UUID ${payload.id}, got ${res.status}`);
    }
  }

  console.log("\n[3.2] Running checkoutQueue.flushPending() to simulate sync retry loop...");
  const retryFlush = await checkoutQueue.flushPending();
  console.log(` -> Retry flush result: flushed=${retryFlush.flushed}, failed=${retryFlush.failed}`);

  // Query Postgres again to confirm row count did NOT increase
  const finalCount = await prisma.transaction.count();
  console.log(`\n[3.3] Final Postgres transaction count: ${finalCount}`);
  if (finalCount !== afterCount) {
    throw new Error(`Idempotency failure! Transaction count changed from ${afterCount} to ${finalCount}`);
  }

  console.log("✔ SUCCESS: Idempotency key (client UUID) completely prevented duplicate rows in Postgres!");
  console.log("\n===============================================================");
  console.log("ALL PHASE 5 VERIFICATION CHECKS PASSED PERFECTLY!");
  console.log("===============================================================");

  sqlite.close();
}

run()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

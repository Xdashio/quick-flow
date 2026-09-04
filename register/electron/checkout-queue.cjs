// CheckoutQueue: Offline-capable cash sale queue
// Stores pending payloads in pending_transactions SQLite table, retries when online
// Receipt printing and drawer kick happen IMMEDIATELY
// Backend logging is queued.

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const RegisterPrinter = require("./printer.cjs");

class CheckoutQueue {
  constructor(options = {}) {
    this.dbPath = options.dbPath || path.resolve(__dirname, "../data/pos.db");
    this.apiUrl = options.apiUrl || process.env.POS_API_URL || "http://localhost:3000/api";
    this.printer = new RegisterPrinter({ virtualDir: options.virtualDir });
    // alias for legacy
    this.virtualDir = this.printer.virtualDir;
  }

  // Called by SyncService each sync tick so we always POST to the same
  // backend that just won the failover race.
  setApiUrl(url) {
    if (url) this.apiUrl = url;
  }

  getDb() {
    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
    const db = new Database(this.dbPath);
    db.pragma("journal_mode = WAL");
    return db;
  }

  // Queue a payload for later sync — used when offline
  queue(payload) {
    const db = this.getDb();
    try {
      const id = payload.id;
      db.prepare(
        `INSERT OR REPLACE INTO pending_transactions (id, payload, status, created_at) VALUES (?, ?, 'pending_sync', datetime('now'))`
      ).run(id, JSON.stringify(payload));
      console.log(`[CheckoutQueue] Queued transaction ${id} (offline)`);
      return { queued: true, id };
    } finally {
      db.close();
    }
  }

  sanitizeForBackend(payload) {
    // Strip UI-only fields like `name` from lineItems before backend submit (backend DTO whitelist forbids extras)
    const copy = JSON.parse(JSON.stringify(payload));
    if (Array.isArray(copy.lineItems)) {
      copy.lineItems = copy.lineItems.map(({ name, productName, ...rest }) => rest);
    }
    return copy;
  }

  async attemptOnlineSubmit(payload) {
    const sanitized = this.sanitizeForBackend(payload);
    const res = await fetch(`${this.apiUrl}/checkout/cash`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sanitized),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Checkout failed ${res.status}: ${body}`);
    }
    return res.json();
  }

  // Core method called from IPC: completeCashSale
  // Always prints receipt + kicks drawer locally, then tries backend; if offline, queues.
  async completeCashSale(payload, opts = {}) {
    const amountTenderedCents = payload.amountTenderedCents;
    const totalCents = payload.totalCents;
    const changeDueCents = amountTenderedCents - totalCents;

    // Validation integer cents
    if (!Number.isInteger(amountTenderedCents) || !Number.isInteger(totalCents)) {
      throw new Error("Monetary values must be integer cents");
    }
    if (amountTenderedCents < totalCents) {
      throw new Error(`Insufficient tendered: ${amountTenderedCents} < ${totalCents}`);
    }

    // Enrich payload with lineItems product names if missing? Expect caller already has names
    // But ensure product name present for receipt
    const txForReceipt = {
      id: payload.id,
      createdAt: payload.createdAt || new Date().toISOString(),
      locationId: payload.locationId,
      registerId: payload.registerId || null,
      cashierId: payload.cashierId || null,
      subtotalCents: payload.subtotalCents,
      taxCents: payload.taxCents,
      totalCents: payload.totalCents,
      lineItems: payload.lineItems.map((li) => ({
        name: li.name || li.productName || `SKU ${li.productId.substring(0, 8)}`,
        quantity: li.quantity,
        unitPriceCents: li.unitPriceCents,
        lineTotalCents: li.lineTotalCents,
        taxRateBp: li.taxRateBp,
      })),
      payment: { method: "cash", amountCents: payload.totalCents, status: "captured" },
      changeDueCents,
      amountTenderedCents,
    };

    // 1. Print receipt via ESC/POS abstraction (always, even offline) + kick drawer via printer
    let receiptResult = null;
    let drawerKick = null;
    try {
      receiptResult = await this.printer.printReceipt(txForReceipt);
      drawerKick = await this.printer.kickDrawer(0);
      console.log(`[CheckoutQueue] Receipt printed (${receiptResult.bytesLength} bytes), drawer kick ${drawerKick.bytesHex}`);
    } catch (e) {
      console.warn(`[CheckoutQueue] Receipt print error: ${e.message}`);
    }

    // 2. Try backend online submit
    try {
      const backendResult = await this.attemptOnlineSubmit(payload);
      console.log(`[CheckoutQueue] Online checkout success ${payload.id}`);

      // Update queued row if existed (mark synced)
      const db = this.getDb();
      try {
        db.prepare(`UPDATE pending_transactions SET status='synced' WHERE id=?`).run(payload.id);
      } catch {}
      db.close();

      return {
        success: true,
        offline: false,
        transaction: backendResult.transaction,
        payment: backendResult.payment,
        drawerEvent: backendResult.drawerEvent,
        changeDueCents,
        receipt: backendResult.receipt || receiptResult,
        drawerKick,
      };
    } catch (err) {
      const msg = err.message || String(err);
      // Network/offline -> queue
      if (msg.includes("fetch failed") || msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND") || msg.includes("timeout") || msg.includes("TimeoutError") || msg.includes("NetworkError") || msg.includes("Failed to fetch") || err.cause) {
        // Check if it's a network error vs business error
        // For business errors (400/409), we should NOT queue — surface error immediately
        if (msg.includes("Insufficient") || msg.includes("400") || msg.includes("409") || msg.includes("Insufficient tendered")) {
          throw err;
        }
        // Queue as offline
        this.queue(payload);
        // Also queue drawer event offline? Already logged via receipt kick, but also ensure drawer_events endpoint will be called on sync
        // For now, the drawer kick was already done locally; backend drawer_event will be reconciled when queued transaction syncs (checkout endpoint creates it)
        return {
          success: true,
          offline: true,
          queued: true,
          transactionId: payload.id,
          changeDueCents,
          receipt: receiptResult,
          drawerKick,
          error: msg,
        };
      }

      // If it's a network-level failure without status prefix, queue; otherwise rethrow
      // Detect if error came from fetch throws (offline) vs backend 4xx
      if (!msg.match(/Checkout failed \d+/) || msg.includes("fetch failed") || msg.includes("ECONN")) {
        this.queue(payload);
        return {
          success: true,
          offline: true,
          queued: true,
          transactionId: payload.id,
          changeDueCents,
          receipt: receiptResult,
          drawerKick,
          error: msg,
        };
      }

      throw err;
    }
  }

  // Drawer open without sale — logs to backend if online, else queues in drawer_events offline table extension
  // But since pending_transactions covers checkout sale, non-sale drawer needs its own offline handling
  // We use pending_transactions with a special type or separate handling: we queue a drawer payload
  async openDrawerNoSale({ registerId, userId, reason = "no_sale", amountCents = 0 }) {
    // Kick drawer locally immediately
    let kick = null;
    try {
      kick = await this.printer.kickDrawer(0);
    } catch (e) {
      console.warn(`[CheckoutQueue] No-sale drawer kick error: ${e.message}`);
    }

    // Try backend
    try {
      const res = await fetch(`${this.apiUrl}/checkout/drawer/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registerId, userId, reason, amountCents }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`Drawer open failed ${res.status}: ${await res.text()}`);
      const body = await res.json();
      return { success: true, offline: false, drawerEvent: body, kick };
    } catch (err) {
      // Queue drawer event into pending_transactions as a typed entry so it syncs later
      // Use separate file queue dir
      const db = this.getDb();
      try {
        // Ensure table exists for pending drawer events (reuse pending_transactions with prefix)
        const queueId = `drawer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const payload = { type: "drawer_event", registerId, userId, reason, amountCents };
        db.prepare(`INSERT INTO pending_transactions (id, payload, status, created_at) VALUES (?, ?, 'pending_sync', datetime('now'))`).run(queueId, JSON.stringify(payload));
        console.log(`[CheckoutQueue] Drawer ${reason} queued offline ${queueId}`);
      } catch (e) {
        console.warn(`[CheckoutQueue] Failed to queue drawer event: ${e.message}`);
      } finally {
        db.close();
      }
      return { success: true, offline: true, queued: true, kick, reason };
    }
  }

  // Called by SyncService periodic sync to flush queued transactions
  async flushPending() {
    const db = this.getDb();
    let rows;
    try {
      rows = db.prepare(`SELECT id, payload, status FROM pending_transactions WHERE status='pending_sync' ORDER BY created_at ASC LIMIT 20`).all();
    } catch (e) {
      db.close();
      return { flushed: 0, failed: 0, errors: [e.message] };
    }

    let flushed = 0, failed = 0;
    const errors = [];
    for (const row of rows) {
      let payload;
      try { payload = JSON.parse(row.payload); } catch { continue; }
      // Determine type
      const isDrawer = payload.type === "drawer_event";
      try {
        if (isDrawer) {
          const res = await fetch(`${this.apiUrl}/checkout/drawer/open`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ registerId: payload.registerId, userId: payload.userId, reason: payload.reason, amountCents: payload.amountCents }),
            signal: AbortSignal.timeout(8000),
          });
          if (!res.ok) throw new Error(`Drawer sync failed ${res.status}`);
          db.prepare(`UPDATE pending_transactions SET status='synced' WHERE id=?`).run(row.id);
          flushed++;
        } else {
          const sanitized = this.sanitizeForBackend(payload);
          const res = await fetch(`${this.apiUrl}/checkout/cash`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sanitized),
            signal: AbortSignal.timeout(8000),
          });
          if (!res.ok) {
            const body = await res.text();
            // If conflict (already exists due to idempotency), mark synced
            if (res.status === 409) {
              db.prepare(`UPDATE pending_transactions SET status='synced' WHERE id=?`).run(row.id);
              flushed++;
              continue;
            }
            throw new Error(`Sync failed ${res.status}: ${body}`);
          }
          db.prepare(`UPDATE pending_transactions SET status='synced' WHERE id=?`).run(row.id);
          flushed++;
        }
      } catch (e) {
        failed++;
        errors.push(`${row.id}: ${e.message}`);
      }
    }
    db.close();
    if (flushed > 0) console.log(`[CheckoutQueue] Flushed ${flushed} queued, ${failed} failed`);
    return { flushed, failed, errors };
  }

  getPendingCount() {
    const db = this.getDb();
    try {
      return db.prepare(`SELECT COUNT(*) as c FROM pending_transactions WHERE status='pending_sync'`).get().c;
    } catch { return 0; }
    finally { db.close(); }
  }
}

module.exports = CheckoutQueue;

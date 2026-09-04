// SyncService: Pulls catalog & tax categories from NestJS backend into local SQLite cache.
// Offline-first: on error/offline, preserves existing SQLite cache.
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

class SyncService {
  constructor(options = {}) {
    this.dbPath = options.dbPath || path.resolve(__dirname, "../data/pos.db");
    this.apiUrl = options.apiUrl || process.env.POS_API_URL || "http://localhost:3000/api";
    this.intervalMs = options.intervalMs || 30000;
    this.offlineCheckIntervalMs = options.offlineCheckIntervalMs || 4000;
    this.checkoutQueue = options.checkoutQueue || null;
    this.timer = null;
    this.probeTimer = null;
    this.isSyncing = false;
    this.isCurrentlyOnline = null;
    this.listeners = [];
  }

  getDb() {
    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
    const db = new Database(this.dbPath);
    db.pragma("journal_mode = WAL");
    return db;
  }

  onSync(fn) {
    this.listeners.push(fn);
  }

  notifyListeners(status) {
    for (const fn of this.listeners) {
      try {
        fn(status);
      } catch (err) {
        console.error("[SyncService] Listener error:", err);
      }
    }
  }

  // Real network probe against backend health or catalog (anti-mock: real HTTP request)
  async checkConnectivity() {
    try {
      const healthUrl = `${this.apiUrl}/health`;
      const res = await fetch(healthUrl, {
        method: "GET",
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) return true;
    } catch {}

    try {
      const res2 = await fetch(`${this.apiUrl}/tax-categories`, {
        method: "GET",
        signal: AbortSignal.timeout(3000),
      });
      return res2.ok;
    } catch {
      return false;
    }
  }

  // Triggered when OS/browser fires network online or probe detects recovery
  async handleConnectivityChange(isOnline) {
    const wasOnline = this.isCurrentlyOnline;
    this.isCurrentlyOnline = isOnline;

    if (isOnline && wasOnline === false) {
      console.log("[SyncService] Network connectivity restored! Triggering immediate sync...");
      return this.sync();
    }
  }

  async sync() {
    if (this.isSyncing) {
      console.log("[SyncService] Sync already in progress, skipping");
      return this.getStatus();
    }

    this.isSyncing = true;
    console.log(`[SyncService] Starting sync against ${this.apiUrl}...`);

    let db;
    try {
      db = this.getDb();

      // 1. Fetch Tax Categories
      const taxRes = await fetch(`${this.apiUrl}/tax-categories`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!taxRes.ok) {
        throw new Error(`Tax categories fetch failed with status ${taxRes.status}`);
      }
      const taxCategories = await taxRes.json();

      // 2. Fetch Products
      const prodRes = await fetch(`${this.apiUrl}/products`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!prodRes.ok) {
        throw new Error(`Products fetch failed with status ${prodRes.status}`);
      }
      const products = await prodRes.json();

      // 3. Upsert Tax Categories
      const upsertTax = db.prepare(`
        INSERT INTO tax_categories (id, name, rate_bp)
        VALUES (@id, @name, @rate_bp)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          rate_bp = excluded.rate_bp
      `);

      const upsertAllTaxes = db.transaction((categories) => {
        for (const tc of categories) {
          upsertTax.run({
            id: tc.id,
            name: tc.name,
            rate_bp: tc.rateBp ?? tc.rate_bp ?? 0,
          });
        }
      });
      upsertAllTaxes(taxCategories);

      // 4. Upsert Products
      const upsertProduct = db.prepare(`
        INSERT INTO products (
          id, sku, barcode, name, description, unit_type,
          is_weighed, price_cents, tax_category_id, category_id,
          active, created_at, updated_at
        ) VALUES (
          @id, @sku, @barcode, @name, @description, @unit_type,
          @is_weighed, @price_cents, @tax_category_id, @category_id,
          @active, @created_at, @updated_at
        )
        ON CONFLICT(id) DO UPDATE SET
          sku = excluded.sku,
          barcode = excluded.barcode,
          name = excluded.name,
          description = excluded.description,
          unit_type = excluded.unit_type,
          is_weighed = excluded.is_weighed,
          price_cents = excluded.price_cents,
          tax_category_id = excluded.tax_category_id,
          category_id = excluded.category_id,
          active = excluded.active,
          updated_at = excluded.updated_at
      `);

      // Deactivate products no longer present on backend (if backend responded with full list)
      const remoteProductIds = new Set(products.map((p) => p.id));
      const upsertAllProducts = db.transaction((prods) => {
        for (const p of prods) {
          upsertProduct.run({
            id: p.id,
            sku: p.sku,
            barcode: p.barcode || null,
            name: p.name,
            description: p.description || null,
            unit_type: p.unitType || p.unit_type || "each",
            is_weighed: p.isWeighed || p.is_weighed ? 1 : 0,
            price_cents: p.priceCents ?? p.price_cents ?? 0,
            tax_category_id: p.taxCategoryId || p.tax_category_id || null,
            category_id: p.categoryId || p.category_id || null,
            active: p.active !== false ? 1 : 0,
            created_at: p.createdAt || new Date().toISOString(),
            updated_at: p.updatedAt || new Date().toISOString(),
          });
        }

        // If backend returned zero products, deactivate all or delete local cache if needed
        const localProducts = db.prepare(`SELECT id FROM products WHERE active = 1`).all();
        const deactivateStmt = db.prepare(`UPDATE products SET active = 0 WHERE id = ?`);
        for (const lp of localProducts) {
          if (!remoteProductIds.has(lp.id)) {
            deactivateStmt.run(lp.id);
          }
        }
      });
      upsertAllProducts(products);

      // 5. Update sync_meta
      const setMeta = db.prepare(`
        INSERT INTO sync_meta (key, value, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = datetime('now')
      `);

      const nowIso = new Date().toISOString();
      const metaTx = db.transaction(() => {
        setMeta.run("last_sync_at", nowIso);
        setMeta.run("last_sync_status", "success");
        setMeta.run("error_message", "");
      });
      metaTx();

      const counts = this.getCounts(db);
      console.log(
        `[SyncService] Sync complete. Products: ${counts.productsCount}, Tax categories: ${counts.taxCategoriesCount}`
      );

      // Flush queued cash sales
      let pendingFlush = null;
      if (this.checkoutQueue) {
        try {
          pendingFlush = await this.checkoutQueue.flushPending();
          if (pendingFlush.flushed > 0) {
            console.log(`[SyncService] Flushed queued transactions: ${JSON.stringify(pendingFlush)}`);
          }
        } catch (e) {
          console.warn(`[SyncService] Queue flush error: ${e.message}`);
        }
      }

      this.isCurrentlyOnline = true;
      const pendingCount = this.checkoutQueue ? this.checkoutQueue.getPendingCount() : 0;
      const status = {
        success: true,
        isOnline: true,
        lastSyncAt: nowIso,
        status: "synced",
        productsCount: counts.productsCount,
        taxCategoriesCount: counts.taxCategoriesCount,
        pendingCount,
        pendingFlush,
        errorMessage: null,
      };

      this.notifyListeners(status);
      return status;
    } catch (err) {
      this.isCurrentlyOnline = false;
      console.warn("[SyncService] Sync failed (operating in offline cache mode):", err.message);

      if (db) {
        try {
          const setMeta = db.prepare(`
            INSERT INTO sync_meta (key, value, updated_at)
            VALUES (?, ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET
              value = excluded.value,
              updated_at = datetime('now')
          `);
          setMeta.run("last_sync_status", "error");
          setMeta.run("error_message", err.message);
        } catch (metaErr) {
          console.error("[SyncService] Failed to record error metadata:", metaErr);
        }
      }

      const status = this.getStatus(db, err.message);
      this.notifyListeners(status);
      return status;
    } finally {
      if (db) db.close();
      this.isSyncing = false;
    }
  }

  getCounts(db) {
    const productsCount = db
      .prepare(`SELECT COUNT(*) as count FROM products WHERE active = 1`)
      .get().count;
    const taxCategoriesCount = db
      .prepare(`SELECT COUNT(*) as count FROM tax_categories`)
      .get().count;
    return { productsCount, taxCategoriesCount };
  }

  getStatus(existingDb = null, currentError = null) {
    let db = existingDb;
    let shouldClose = false;
    if (!db) {
      db = this.getDb();
      shouldClose = true;
    }

    try {
      const metas = db.prepare(`SELECT key, value FROM sync_meta`).all();
      const metaMap = {};
      for (const m of metas) {
        metaMap[m.key] = m.value;
      }

      const counts = this.getCounts(db);
      const pendingCount = this.checkoutQueue ? (() => { try { return this.checkoutQueue.getPendingCount(); } catch { return 0; } })() : 0;

      return {
        success: !currentError && metaMap.last_sync_status !== "error",
        isOnline: !currentError,
        lastSyncAt: metaMap.last_sync_at || null,
        status: this.isSyncing
          ? "syncing"
          : currentError || metaMap.last_sync_status === "error"
          ? "offline"
          : metaMap.last_sync_at
          ? "synced"
          : "pending",
        productsCount: counts.productsCount,
        taxCategoriesCount: counts.taxCategoriesCount,
        pendingCount,
        errorMessage: currentError || metaMap.error_message || null,
      };
    } finally {
      if (shouldClose) db.close();
    }
  }

  start() {
    console.log(`[SyncService] Starting background sync interval (${this.intervalMs}ms)`);
    // Run initial sync on startup
    this.sync().catch((err) =>
      console.warn("[SyncService] Initial startup sync error:", err.message)
    );

    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.sync().catch((err) =>
        console.warn("[SyncService] Periodic background sync error:", err.message)
      );
    }, this.intervalMs);

    // Active real-network connectivity probe when offline (adaptive reconnection detection)
    if (this.probeTimer) clearInterval(this.probeTimer);
    this.probeTimer = setInterval(async () => {
      if (this.isCurrentlyOnline === false && !this.isSyncing) {
        const canReach = await this.checkConnectivity();
        if (canReach) {
          console.log("[SyncService] Connectivity probe detected backend online!");
          await this.handleConnectivityChange(true);
        }
      }
    }, this.offlineCheckIntervalMs);

    return () => this.stop();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.probeTimer) {
      clearInterval(this.probeTimer);
      this.probeTimer = null;
    }
    console.log("[SyncService] Background sync interval stopped");
  }
}

module.exports = SyncService;

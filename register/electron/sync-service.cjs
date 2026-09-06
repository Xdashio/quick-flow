// SyncService: Pulls catalog & tax categories from NestJS backend into local SQLite cache.
// Offline-first: on error/offline, preserves existing SQLite cache.
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const { getDbPath } = require("./paths.cjs");

// Backend URLs to try, in order. Explicit env wins; otherwise prefer the
// local dev backend, then fall back to the deployed one so a register with
// a missing/down local backend still syncs. Network failures trigger failover.
const API_URL_CANDIDATES = [
  process.env.POS_API_URL,
  "https://api.crestcyber.co.ke/api",
  "http://localhost:3000/api",
].filter(Boolean);

class SyncService {
  constructor(options = {}) {
    // Default MUST be userData-based (see paths.cjs): bundle-relative
    // __dirname paths are read-only inside an AppImage and wiped on update.
    this.dbPath = options.dbPath || getDbPath();
    this.apiUrls =
      options.apiUrls ||
      (options.apiUrl ? [options.apiUrl] : null) ||
      API_URL_CANDIDATES;
    this.apiUrl = this.apiUrls[0]; // current active backend
    this.intervalMs = options.intervalMs || 30000;
    this.offlineCheckIntervalMs = options.offlineCheckIntervalMs || 4000;
    this.checkoutQueue = options.checkoutQueue || null;
    this.timer = null;
    this.probeTimer = null;
    this.isSyncing = false;
    this.isCurrentlyOnline = null;
    this.listeners = [];
    // Tracks image URLs that returned non-retryable errors (e.g. 404).
    // Cleared when a full new sync finds a different imageKey for the product.
    this._imageFailureCache = new Set();
    // Tracks which backend URLs we've already logged as unreachable so we
    // don't spam the console on every 30-second tick.
    this._lastUnreachableLog = new Map();
  }

  getDb() {
    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
    const db = new Database(this.dbPath);
    // Hardening: if any caller ever bypasses the plugin/main init (tests,
    // ad-hoc scripts), make sure the schema is there before we sync.
    require("./db-schema.cjs").applySchema(db);
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

  // Real network probe against any candidate backend (used for reconnection detection)
  async checkConnectivity() {
    for (const url of this.apiUrls) {
      for (const probePath of ["/health", "/tax-categories"]) {
        try {
          const res = await fetch(`${url}${probePath}`, {
            method: "GET",
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(3000),
          });
          // Require an actual JSON API response. An HTTP-200 HTML interstitial
          // (hosting platform "app is sleeping" page) must not count as online.
          const contentType = res.headers.get("content-type") || "";
          if (res.ok && contentType.includes("application/json")) return true;
        } catch {}
      }
    }
    return false;
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
    let lastErr = null;
    try {
      // Try each candidate backend in order; first one with reachable network wins.
      for (const url of this.apiUrls) {
        try {
          return await this.syncAgainst(url);
        } catch (err) {
          lastErr = err;
          if (err.statusCode && err.statusCode < 500) {
            // 4xx (e.g. auth) — the backend is reachable but refusing us; don't
            // fall through to another URL in that case.
            break;
          }
          // Only log once per distinct message per URL to avoid 30-second spam.
          const logKey = `${url}::${err.message}`;
          if (this._lastUnreachableLog.get(url) !== logKey) {
            this._lastUnreachableLog.set(url, logKey);
            console.warn(`[SyncService] ${url} unreachable (${err.message}), trying next backend...`);
          }
        }
      }
      throw lastErr || new Error("No backend URL configured");
    } catch (err) {
      this.isCurrentlyOnline = false;
      console.warn("[SyncService] Sync failed (operating in offline cache mode):", err.message);
      this.recordErrorMeta(err.message);
      const status = this.getStatus(null, err.message);
      this.notifyListeners(status);
      return status;
    } finally {
      this.isSyncing = false;
    }
  }

  recordErrorMeta(message) {
    let db;
    try {
      db = this.getDb();
      const setMeta = db.prepare(`
        INSERT INTO sync_meta (key, value, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = datetime('now')
      `);
      setMeta.run("last_sync_status", "error");
      setMeta.run("error_message", message);
    } catch (metaErr) {
      console.error("[SyncService] Failed to record error metadata:", metaErr);
    } finally {
      if (db) db.close();
    }
  }

  async syncAgainst(apiUrl) {
    console.log(`[SyncService] Starting sync against ${apiUrl}...`);

    let db;
    try {
      db = this.getDb();

      // Fetch all three resources, propagating HTTP status when the server responds.
      const fetchCatalog = async (path) => {
        const res = await fetch(`${apiUrl}${path}`, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) {
          // A WAF/bot-protection layer (e.g. Imunify360 on shared hosting)
          // answers API clients with 403 + a JSON "access denied" page. That's
          // infrastructure blocking us, not the API refusing — treat it as
          // unreachable (no statusCode) so sync() fails over to the next
          // backend instead of breaking out of the candidate loop.
          if (res.status === 403) {
            const bodyText = await res.text().catch(() => "");
            if (/imunify|bot[- ]?protection/i.test(bodyText)) {
              throw new Error(`WAF/bot-protection blocked the request (HTTP 403)`);
            }
          }
          const err = new Error(`GET ${path} failed with status ${res.status}`);
          err.statusCode = res.status;
          throw err;
        }
        // A real backend answers with JSON. Hosting platforms sometimes serve
        // an HTML interstitial ("One moment, please...") with HTTP 200 when
        // the app is down or sleeping — without this check, res.json() throws
        // the cryptic `Unexpected token '<' ... is not valid JSON` error.
        // Deliberately no statusCode: sync() treats it as unreachable and
        // moves on to the next backend candidate.
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error(
            `GET ${path} returned ${contentType || "unknown content-type"} instead of JSON (backend down/sleeping or wrong URL)`,
          );
        }
        return res.json();
      };

      const [taxCategories, products, categories] = await Promise.all([
        fetchCatalog("/tax-categories"),
        fetchCatalog("/products"),
        fetchCatalog("/categories"),
      ]);

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

      // 3b. Upsert Categories
      const upsertCategory = db.prepare(`
        INSERT INTO categories (id, name, parent_id)
        VALUES (@id, @name, @parent_id)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          parent_id = excluded.parent_id
      `);

      const remoteCategoryIds = new Set(categories.map((c) => c.id));
      const upsertAllCategories = db.transaction((cats) => {
        for (const c of cats) {
          upsertCategory.run({
            id: c.id,
            name: c.name,
            parent_id: c.parentId ?? c.parent_id ?? null,
          });
        }

        // Remove local categories no longer present on backend
        const localCategories = db.prepare(`SELECT id FROM categories`).all();
        const deleteCatStmt = db.prepare(`DELETE FROM categories WHERE id = ?`);
        for (const lc of localCategories) {
          if (!remoteCategoryIds.has(lc.id)) {
            deleteCatStmt.run(lc.id);
          }
        }
      });
      upsertAllCategories(categories);

      // 4. Upsert Products
      const upsertProduct = db.prepare(`
        INSERT INTO products (
          id, sku, barcode, name, description, unit_type,
          is_weighed, price_cents, tax_category_id, category_id,
          active, image_key, created_at, updated_at
        ) VALUES (
          @id, @sku, @barcode, @name, @description, @unit_type,
          @is_weighed, @price_cents, @tax_category_id, @category_id,
          @active, @image_key, @created_at, @updated_at
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
          image_key = excluded.image_key,
          updated_at = excluded.updated_at
      `);

      // Deactivate products no longer present on backend (if backend responded with full list)
      const remoteProductIds = new Set(products.map((p) => p.id));
      const deleteSkuConflict = db.prepare(`DELETE FROM products WHERE sku = ? AND id != ?`);
      const upsertAllProducts = db.transaction((prods) => {
        for (const p of prods) {
          if (p.sku) {
            deleteSkuConflict.run(p.sku, p.id);
          }
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
            image_key: p.imageKey || p.image_key || null,
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

      // 5. Cache product images (download once, skip if already cached)
      const productsWithImages = products.filter(
        (p) => (p.imageUrl || p.imageKey) && (p.active !== false)
      );
      if (productsWithImages.length > 0) {
        let cached = 0, skipped = 0, failed = 0;
        const failReasons = [];
        // Sequential to avoid hammering the CDN; images are small so this is fast
        for (const p of productsWithImages) {
          try {
            const result = await this.cacheProductImage(db, p);
            if (result === 'cached') cached++;
            else skipped++; // already on disk
          } catch (imgErr) {
            failed++;
            // Only accumulate error details; suppress per-product spam.
            failReasons.push(`${p.id.slice(0, 8)}: ${imgErr.message}`);
          }
        }
        const parts = [];
        if (cached > 0) parts.push(`${cached} downloaded`);
        if (skipped > 0) parts.push(`${skipped} already cached`);
        if (failed > 0) parts.push(`${failed} failed`);
        console.log(`[SyncService] Images — ${parts.join(', ')}`);
        // Log a single collapsed failure line only when something changed.
        if (failed > 0 && failReasons.length > 0) {
          console.warn(`[SyncService] Image fetch failures (non-fatal): ${failReasons.slice(0, 5).join(' | ')}${failReasons.length > 5 ? ` … +${failReasons.length - 5} more` : ''}`);
        }
      }

      // Evict cached images for products that no longer have an imageKey
      const productsWithoutImages = products.filter((p) => !p.imageKey && !p.image_key);
      for (const p of productsWithoutImages) {
        await this.evictProductImage(p.id);
      }

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

      // Flush queued cash sales against the same backend that just won this sync.
      let pendingFlush = null;
      if (this.checkoutQueue) {
        try {
          this.checkoutQueue.setApiUrl(this.apiUrl);
          pendingFlush = await this.checkoutQueue.flushPending();
          if (pendingFlush.flushed > 0) {
            console.log(`[SyncService] Flushed queued transactions: ${JSON.stringify(pendingFlush)}`);
          }
        } catch (e) {
          console.warn(`[SyncService] Queue flush error: ${e.message}`);
        }
      }

      this.isCurrentlyOnline = true;
      this.apiUrl = apiUrl; // stick to whichever backend won the race
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
      // Rethrow — sync() above decides whether to try the next backend.
      throw err;
    } finally {
      if (db) db.close();
    }
  }

  /**
   * Downloads and caches a product image to disk.
   * Skips if the image_key hasn't changed since last cache.
   * Images are stored as: <userData>/images/<productId>.<ext>
   */
  async cacheProductImage(db, product) {
    const imageKey = product.imageKey || product.image_key;
    let imageUrl = product.imageUrl;
    if (!imageUrl && imageKey) {
      if (imageKey.startsWith("http://") || imageKey.startsWith("https://")) {
        // imageKey is already a full URL — use it directly, do NOT prepend CDN base.
        imageUrl = imageKey;
      } else if (this.cdnUrl) {
        imageUrl = `${this.cdnUrl}/${imageKey}`;
      }
    }
    if (!imageKey || !imageUrl) return 'skipped';

    // Skip URLs we already know are broken (404 etc.) until imageKey changes.
    if (this._imageFailureCache.has(imageUrl)) return 'skipped';

    const path = require("path");
    const fs = require("fs");
    const imagesDir = path.join(path.dirname(this.dbPath), "images");
    fs.mkdirSync(imagesDir, { recursive: true });

    // Clean extension (strip any query parameters)
    let ext = ".jpg";
    try {
      const cleanPath = new URL(imageUrl, "http://localhost").pathname;
      ext = path.extname(cleanPath).toLowerCase() || ".jpg";
      if (![".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"].includes(ext)) {
        ext = ".jpg";
      }
    } catch {
      ext = ".jpg";
    }

    // Check if this exact key is already on disk
    const row = db.prepare(`SELECT image_key, image_cached_at FROM products WHERE id = ?`).get(product.id);
    if (row && row.image_key === imageKey && row.image_cached_at) {
      const destPath = path.join(imagesDir, `${product.id}${ext}`);
      if (fs.existsSync(destPath)) return 'skipped'; // already cached
    }

    const destPath = path.join(imagesDir, `${product.id}${ext}`);

    // Remove stale files with different extension
    const allExts = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];
    for (const staleExt of allExts) {
      if (staleExt === ext) continue;
      const stalePath = path.join(imagesDir, `${product.id}${staleExt}`);
      if (fs.existsSync(stalePath)) fs.unlinkSync(stalePath);
    }

    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      // Cache the failure so we don't hammer the CDN on every 30s tick.
      if (res.status === 404 || res.status === 403) {
        this._imageFailureCache.add(imageUrl);
      }
      throw new Error(`HTTP ${res.status} fetching ${imageUrl}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buffer);

    // Mark cached in SQLite
    db.prepare(`UPDATE products SET image_cached_at = ? WHERE id = ?`).run(
      new Date().toISOString(),
      product.id,
    );

    return 'cached';
  }

  /**
   * Removes cached image file(s) for a product that no longer has an imageKey.
   */
  async evictProductImage(productId) {
    const path = require("path");
    const fs = require("fs");
    const imagesDir = path.join(path.dirname(this.dbPath), "images");
    const allExts = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];
    for (const ext of allExts) {
      const p = path.join(imagesDir, `${productId}${ext}`);
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
        console.log(`[SyncService] Evicted cached image for product ${productId}`);
      }
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

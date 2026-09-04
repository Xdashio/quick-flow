// Electron main process — creates real SQLite file on disk & runs background SyncService
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const SyncService = require("./sync-service.cjs");
const CheckoutQueue = require("./checkout-queue.cjs");
const RegisterPrinter = require("./printer.cjs");

const dbPath = path.resolve(__dirname, "../data/pos.db");
let syncService = null;
let checkoutQueue = null;
let registerPrinter = null;
let mainWindow = null;

function getDb() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  return db;
}

function initDb() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS tax_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      rate_bp INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE NOT NULL,
      barcode TEXT,
      name TEXT NOT NULL,
      description TEXT,
      unit_type TEXT NOT NULL DEFAULT 'each',
      is_weighed INTEGER NOT NULL DEFAULT 0,
      price_cents INTEGER NOT NULL,
      tax_category_id TEXT REFERENCES tax_categories(id),
      category_id TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      image_key TEXT,
      image_cached_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

    CREATE TABLE IF NOT EXISTS pending_transactions (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending_sync',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sync_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  // Idempotent migration: add image columns to existing DBs that pre-date this feature
  try {
    db.exec(`ALTER TABLE products ADD COLUMN image_key TEXT`);
  } catch (_) { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE products ADD COLUMN image_cached_at TEXT`);
  } catch (_) { /* column already exists */ }

  db.close();

  // Ensure the image cache directory exists
  const imagesDir = path.join(__dirname, "../data/images");
  fs.mkdirSync(imagesDir, { recursive: true });

  console.log(`[electron] SQLite initialized at ${dbPath}`);
}

function setupIpc() {
  // Search products in local SQLite cache
  ipcMain.handle("db:search-products", async (_event, { query, categoryId }) => {
    const db = getDb();
    try {
      let sql = `
        SELECT p.*, tc.name as tax_category_name, tc.rate_bp as tax_category_rate_bp,
               c.name as category_name
        FROM products p
        LEFT JOIN tax_categories tc ON p.tax_category_id = tc.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.active = 1
      `;
      const params = [];

      if (query && query.trim()) {
        const q = `%${query.trim()}%`;
        const exact = query.trim();
        sql += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode = ?)`;
        params.push(q, q, exact);
      }

      if (categoryId) {
        sql += ` AND p.category_id = ?`;
        params.push(categoryId);
      }

      sql += ` ORDER BY p.name ASC LIMIT 100`;

      return db.prepare(sql).all(...params);
    } finally {
      db.close();
    }
  });

  // Lookup product by exact barcode
  ipcMain.handle("db:get-product-by-barcode", async (_event, barcode) => {
    const db = getDb();
    try {
      return db
        .prepare(
          `SELECT p.*, tc.name as tax_category_name, tc.rate_bp as tax_category_rate_bp,
                  c.name as category_name
           FROM products p
           LEFT JOIN tax_categories tc ON p.tax_category_id = tc.id
           LEFT JOIN categories c ON p.category_id = c.id
           WHERE p.active = 1 AND p.barcode = ?
           LIMIT 1`
        )
        .get(barcode) || null;
    } finally {
      db.close();
    }
  });

  // Get all active products from SQLite cache
  ipcMain.handle("db:get-all-products", async () => {
    const db = getDb();
    try {
      return db
        .prepare(
          `SELECT p.*, tc.name as tax_category_name, tc.rate_bp as tax_category_rate_bp,
                  c.name as category_name
           FROM products p
           LEFT JOIN tax_categories tc ON p.tax_category_id = tc.id
           LEFT JOIN categories c ON p.category_id = c.id
           WHERE p.active = 1
           ORDER BY p.name ASC`
        )
        .all();
    } finally {
      db.close();
    }
  });

  // Get tax categories from SQLite cache
  ipcMain.handle("db:get-tax-categories", async () => {
    const db = getDb();
    try {
      return db
        .prepare(`SELECT * FROM tax_categories ORDER BY rate_bp DESC`)
        .all();
    } finally {
      db.close();
    }
  });

  // Get categories from SQLite cache
  ipcMain.handle("db:get-categories", async () => {
    const db = getDb();
    try {
      return db
        .prepare(`SELECT * FROM categories ORDER BY name ASC`)
        .all();
    } finally {
      db.close();
    }
  });

  // Get sync telemetry
  ipcMain.handle("sync:get-status", async () => {
    if (!syncService) return { status: "idle", productsCount: 0, taxCategoriesCount: 0 };
    return syncService.getStatus();
  });

  // Trigger manual sync
  ipcMain.handle("sync:trigger", async () => {
    if (!syncService) return { status: "error", errorMessage: "SyncService not initialized" };
    const syncResult = await syncService.sync();
    // Also flush queued cash sales
    if (checkoutQueue) {
      const flush = await checkoutQueue.flushPending().catch((e) => ({ flushed: 0, failed: 1, errors: [e.message] }));
      syncResult.pendingFlushed = flush;
    }
    return syncResult;
  });

  // Real network connectivity check
  ipcMain.handle("sync:check-connectivity", async () => {
    if (!syncService) return false;
    return syncService.checkConnectivity();
  });

  // Online transition notification from renderer
  ipcMain.on("sync:network-online", () => {
    if (syncService) {
      syncService.handleConnectivityChange(true);
    }
  });

  // Cash checkout — offline-capable (Phase 4 primary flow)
  ipcMain.handle("checkout:cash", async (_event, payload) => {
    if (!checkoutQueue) throw new Error("CheckoutQueue not initialized");
    return checkoutQueue.completeCashSale(payload);
  });

  // Drawer events: no_sale / manager_override / change — reason-coded
  ipcMain.handle("drawer:open", async (_event, args) => {
    if (!checkoutQueue) throw new Error("CheckoutQueue not initialized");
    return checkoutQueue.openDrawerNoSale(args || {});
  });

  ipcMain.handle("checkout:pending-count", async () => {
    if (!checkoutQueue) return 0;
    return checkoutQueue.getPendingCount();
  });

  // Virtual printer last receipt query (for UI preview)
  ipcMain.handle("printer:last-receipt", async () => {
    const printer = registerPrinter || checkoutQueue?.printer;
    if (!printer) return null;
    const last = printer.getLast();
    if (!last.bytes) return null;
    return {
      path: last.path,
      hex: last.bytes.toString("hex"),
      text: printer.parseEscPosToText(last.bytes),
      bytesLength: last.bytes.length,
    };
  });

  // Direct receipt preview from payload (debug)
  ipcMain.handle("printer:preview", async (_event, tx) => {
    const p = registerPrinter || checkoutQueue?.printer || new RegisterPrinter({});
    return p.printReceipt(tx);
  });

  // ── Image cache ─────────────────────────────────────────────────────────────
  const imagesDir = path.join(__dirname, "../data/images");

  /**
   * Returns the local file:// path for a cached product image, or null if not cached.
   * The renderer uses this to decide whether to show <img src="file://..."> or a placeholder.
   */
  ipcMain.handle("images:get-local-path", (_event, productId) => {
    const exts = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];
    for (const ext of exts) {
      const candidate = path.join(imagesDir, `${productId}${ext}`);
      if (fs.existsSync(candidate)) {
        return `file://${candidate}`;
      }
    }
    return null;
  });

  /**
   * Prefetch/cache a product image from a CDN URL.
   * Called by the sync service after each product sync — downloads once,
   * stores at data/images/<productId>.<ext>, marks image_cached_at in SQLite.
   * Safe to call repeatedly — skips if already cached and key hasn't changed.
   */
  ipcMain.handle("images:cache-image", async (_event, { productId, imageKey, imageUrl }) => {
    if (!imageUrl || !productId) return { cached: false, reason: "no imageUrl" };

    const ext = path.extname(imageKey || imageUrl).toLowerCase() || ".jpg";
    const destPath = path.join(imagesDir, `${productId}${ext}`);

    // Check if already cached by comparing what's on disk
    const db = getDb();
    try {
      const row = db.prepare(`SELECT image_key, image_cached_at FROM products WHERE id = ?`).get(productId);
      if (row && row.image_key === imageKey && row.image_cached_at && fs.existsSync(destPath)) {
        return { cached: true, reason: "already cached", localPath: `file://${destPath}` };
      }
    } finally {
      db.close();
    }

    // Download image
    try {
      const res = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) return { cached: false, reason: `fetch failed: ${res.status}` };

      // Remove stale cached files for this product (different extension)
      const staleExts = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"].filter((e) => e !== ext);
      for (const staleExt of staleExts) {
        const stalePath = path.join(imagesDir, `${productId}${staleExt}`);
        if (fs.existsSync(stalePath)) fs.unlinkSync(stalePath);
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(destPath, buffer);

      // Mark as cached in SQLite
      const db2 = getDb();
      try {
        db2.prepare(`UPDATE products SET image_cached_at = ? WHERE id = ?`).run(new Date().toISOString(), productId);
      } finally {
        db2.close();
      }

      return { cached: true, localPath: `file://${destPath}` };
    } catch (err) {
      console.warn(`[images] Failed to cache image for product ${productId}:`, err.message);
      return { cached: false, reason: err.message };
    }
  });

  /**
   * Remove a cached image file for a product (e.g. when image is cleared on backend).
   */
  ipcMain.handle("images:evict-cache", (_event, productId) => {
    const exts = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];
    let removed = 0;
    for (const ext of exts) {
      const p = path.join(imagesDir, `${productId}${ext}`);
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
        removed++;
      }
    }
    return { removed };
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: "#09090b",
    titleBarStyle: "hiddenInset",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  const devUrl = "http://localhost:5173";
  const prodFile = path.join(__dirname, "../dist/index.html");

  if (fs.existsSync(prodFile)) {
    mainWindow.loadFile(prodFile);
  } else {
    mainWindow.loadURL(devUrl).catch(() => {
      console.log("[electron] dev server not running — run `npm run dev` in register");
      mainWindow.loadURL(
        `data:text/html,<h1>POS Register</h1><p>Vite dev server at ${devUrl} is waiting to start...</p>`
      );
    });
  }
}

app.whenReady().then(() => {
  initDb();
  // Initialize printer & checkout queue before IPC wiring
  registerPrinter = new RegisterPrinter({
    virtualDir: path.join(__dirname, "../data/virtual-printer"),
    printerHost: process.env.POS_PRINTER_HOST,
    printerPort: process.env.POS_PRINTER_PORT,
  });
  checkoutQueue = new CheckoutQueue({
    dbPath,
    apiUrl: process.env.POS_API_URL || "http://localhost:3000/api",
    virtualDir: path.join(__dirname, "../data/virtual-printer"),
  });

  setupIpc();

  // Initialize and start background sync service
  syncService = new SyncService({
    dbPath,
    apiUrl: process.env.POS_API_URL || "http://localhost:3000/api",
    intervalMs: 30000,
    checkoutQueue, // inject for flush on each sync tick
  });

  syncService.onSync((status) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("sync:update", status);
    }
  });

  syncService.start();

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (syncService) syncService.stop();
  if (process.platform !== "darwin") app.quit();
});

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
  db.close();
  console.log(`[electron] SQLite initialized at ${dbPath}`);
}

function setupIpc() {
  // Search products in local SQLite cache
  ipcMain.handle("db:search-products", async (_event, { query, categoryId }) => {
    const db = getDb();
    try {
      let sql = `
        SELECT p.*, tc.name as tax_category_name, tc.rate_bp as tax_category_rate_bp
        FROM products p
        LEFT JOIN tax_categories tc ON p.tax_category_id = tc.id
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
          `SELECT p.*, tc.name as tax_category_name, tc.rate_bp as tax_category_rate_bp
           FROM products p
           LEFT JOIN tax_categories tc ON p.tax_category_id = tc.id
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
          `SELECT p.*, tc.name as tax_category_name, tc.rate_bp as tax_category_rate_bp
           FROM products p
           LEFT JOIN tax_categories tc ON p.tax_category_id = tc.id
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

  // Cash checkout — offline-capable (Phase 4 primary flow)
  ipcMain.handle("checkout:cash", async (_event, payload) => {
    if (!checkoutQueue) throw new Error("CheckoutQueue not initialized");
    return checkoutQueue.completeCashSale(payload);
  });

  // Drawer events: no_sale / manager_override / change — reason-coded §5.3
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

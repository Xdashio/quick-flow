// Electron main process — creates real SQLite file on disk (Phase 0 verification)
const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");

let Database;
try {
  Database = require("better-sqlite3");
} catch (e) {
  console.warn("[electron] better-sqlite3 not available yet (run npm install):", e.message);
}

function initDb() {
  if (!Database) {
    console.warn("[electron] skipping DB init — better-sqlite3 missing");
    return null;
  }
  const dbPath = path.join(__dirname, "../data/pos.db");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.exec(`
    PRAGMA journal_mode = WAL;
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
  const seed = db.prepare(`INSERT OR IGNORE INTO tax_categories (id, name, rate_bp) VALUES (?, ?, ?)`);
  seed.run("tax-standard", "standard", 1600);
  seed.run("tax-zero", "zero_rated", 0);
  seed.run("tax-exempt", "exempt", 0);
  const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`).all();
  console.log(`[electron] SQLite ready at ${dbPath}`);
  console.log(`[electron] tables:`, tables.map(t => t.name).join(", "));
  db.close();
  return dbPath;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  // In dev, Vite serves at 5173; in prod, load dist/renderer/index.html
  const devUrl = "http://localhost:5173";
  const prodFile = path.join(__dirname, "../dist/renderer/index.html");
  if (fs.existsSync(prodFile)) {
    win.loadFile(prodFile);
  } else {
    win.loadURL(devUrl).catch(() => {
      console.log("[electron] dev server not running — run `npm run dev` in register");
      win.loadURL(`data:text/html,<h1>POS Register — Phase 0</h1><p>Run <code>npm run dev</code> in register for Vite dev server at ${devUrl}</p>`);
    });
  }
}

app.whenReady().then(() => {
  initDb();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

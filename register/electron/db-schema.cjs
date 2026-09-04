// Single source of truth for the register's local SQLite offline-cache schema.
// Used by Electron main process AND the Vite dev-server plugin, so both
// entry points end up with identical tables regardless of how the app starts.
const SCHEMA_SQL = `
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
`;

// Idempotent column-level migrations for DBs created before these columns existed.
const MIGRATIONS = [
  `ALTER TABLE products ADD COLUMN image_key TEXT`,
  `ALTER TABLE products ADD COLUMN image_cached_at TEXT`,
];

/**
 * Applies schema + idempotent column migrations to an open better-sqlite3 handle.
 * Safe to call on every startup — all statements are IF NOT EXISTS / try-catch.
 */
function applySchema(db) {
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA_SQL);
  for (const sql of MIGRATIONS) {
    try {
      db.exec(sql);
    } catch {
      /* column already exists */
    }
  }
}

module.exports = { applySchema };

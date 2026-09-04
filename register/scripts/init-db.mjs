#!/usr/bin/env node
// Creates real SQLite file on disk for Phase 0 verification — not in-memory
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "../data/pos.db");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

// Schema mirrors backend subset needed for offline cache
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

// Seed tax categories (idempotent)
const seedTax = db.prepare(`INSERT OR IGNORE INTO tax_categories (id, name, rate_bp) VALUES (?, ?, ?)`);
seedTax.run("tax-standard", "standard", 1600);
seedTax.run("tax-zero", "zero_rated", 0);
seedTax.run("tax-exempt", "exempt", 0);

console.log(`[register] SQLite initialized at ${dbPath}`);
const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`).all();
console.log("[register] tables:", tables.map(t => t.name).join(", "));
const counts = db.prepare(`SELECT (SELECT COUNT(*) FROM products) as products, (SELECT COUNT(*) FROM tax_categories) as tax_categories, (SELECT COUNT(*) FROM pending_transactions) as pending`).get();
console.log("[register] counts:", counts);
db.close();

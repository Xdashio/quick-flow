#!/usr/bin/env node
// Creates real SQLite file on disk for Phase 0 verification — not in-memory
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { applySchema } = require("../electron/db-schema.cjs");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "../data/pos.db");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
applySchema(db);

// Seed tax categories (idempotent)
const seedTax = db.prepare(`INSERT OR IGNORE INTO tax_categories (id, name, rate_bp) VALUES (?, ?, ?)`);
seedTax.run("tax-standard", "standard", 1600);
seedTax.run("tax-zero", "zero_rated", 0);
seedTax.run("tax-exempt", "exempt", 0);

console.log(`[register] SQLite initialized at ${dbPath}`);
const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`).all();
console.log("[register] tables:", tables.map(t => t.name).join(", "));
const counts = db.prepare(`
  SELECT (SELECT COUNT(*) FROM products) as products,
         (SELECT COUNT(*) FROM tax_categories) as tax_categories,
         (SELECT COUNT(*) FROM categories) as categories,
         (SELECT COUNT(*) FROM pending_transactions) as pending,
         (SELECT COUNT(*) FROM sync_meta) as sync_meta
`).get();
console.log("[register] counts:", counts);
db.close();

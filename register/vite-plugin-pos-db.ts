import type { Plugin } from "vite";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";

export function posDbPlugin(): Plugin {
  const require = createRequire(import.meta.url);
  const dbPath = path.resolve(import.meta.dirname, "data/pos.db");
  let syncService: any = null;

  function getDb() {
    const Database = require("better-sqlite3");
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    return db;
  }

  return {
    name: "vite-plugin-pos-db",
    configureServer(server) {
      // Ensure the offline-cache schema exists before SyncService touches it.
      // Without this, a fresh checkout (no data/pos.db) crashes on the first
      // sync attempt with "no such table: sync_meta".
      const { applySchema } = require("./electron/db-schema.cjs");
      const initDb = getDb();
      applySchema(initDb);
      initDb.close();

      const SyncService = require("./electron/sync-service.cjs");
      // Start background sync job in Vite dev server
      syncService = new SyncService({
        dbPath,
        apiUrl: process.env.POS_API_URL || "http://localhost:3000/api",
        intervalMs: 30000,
      });
      syncService.start();

      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? new URL(req.url, `http://${req.headers.host}`) : null;
        if (!url || !url.pathname.startsWith("/api/local-sqlite")) {
          return next();
        }

        res.setHeader("Content-Type", "application/json");

        try {
          if (url.pathname === "/api/local-sqlite/products") {
            const query = url.searchParams.get("query") || "";
            const categoryId = url.searchParams.get("categoryId") || "";
            const barcode = url.searchParams.get("barcode") || "";

            const db = getDb();
            try {
              if (barcode) {
                const item = db
                  .prepare(
                    `SELECT p.*, tc.name as tax_category_name, tc.rate_bp as tax_category_rate_bp,
                            c.name as category_name
                     FROM products p
                     LEFT JOIN tax_categories tc ON p.tax_category_id = tc.id
                     LEFT JOIN categories c ON p.category_id = c.id
                     WHERE p.active = 1 AND p.barcode = ? LIMIT 1`
                  )
                  .get(barcode);
                res.end(JSON.stringify(item || null));
                return;
              }

              let sql = `
                SELECT p.*, tc.name as tax_category_name, tc.rate_bp as tax_category_rate_bp,
                       c.name as category_name
                FROM products p
                LEFT JOIN tax_categories tc ON p.tax_category_id = tc.id
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.active = 1
              `;
              const params: any[] = [];

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

              const rows = db.prepare(sql).all(...params);
              res.end(JSON.stringify(rows));
              return;
            } finally {
              db.close();
            }
          }

          if (url.pathname === "/api/local-sqlite/tax-categories") {
            const db = getDb();
            try {
              const rows = db
                .prepare(`SELECT * FROM tax_categories ORDER BY rate_bp DESC`)
                .all();
              res.end(JSON.stringify(rows));
              return;
            } finally {
              db.close();
            }
          }

          if (url.pathname === "/api/local-sqlite/categories") {
            const db = getDb();
            try {
              const rows = db
                .prepare(`SELECT * FROM categories ORDER BY name ASC`)
                .all();
              res.end(JSON.stringify(rows));
              return;
            } finally {
              db.close();
            }
          }

          if (url.pathname === "/api/local-sqlite/sync-status") {
            if (!syncService) {
              res.end(JSON.stringify({ status: "idle", productsCount: 0 }));
              return;
            }
            const status = syncService.getStatus();
            res.end(JSON.stringify(status));
            return;
          }

          if (url.pathname === "/api/local-sqlite/sync-trigger" && req.method === "POST") {
            if (!syncService) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: "Sync service unavailable" }));
              return;
            }
            const status = await syncService.sync();
            res.end(JSON.stringify(status));
            return;
          }

          next();
        } catch (err: any) {
          console.error("[vite-plugin-pos-db] Error handling request:", err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
    buildEnd() {
      if (syncService) syncService.stop();
    },
  };
}

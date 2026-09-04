-- Materialized view for current stock (derived from append-only ledger)
-- Phase 1: Blueprint
-- Current stock is NOT a mutable counter — it's SUM(quantity_delta) grouped
DROP MATERIALIZED VIEW IF EXISTS current_inventory;
CREATE MATERIALIZED VIEW current_inventory AS
    SELECT product_id, location_id, SUM(quantity_delta) AS quantity
    FROM inventory_movements GROUP BY product_id, location_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_current_inventory_pk
    ON current_inventory (product_id, location_id);

-- Refresh strategy: REFRESH MATERIALIZED VIEW CONCURRENTLY current_inventory
-- called after each POST /api/inventory/movements (see inventory.service.ts:35)
-- Verification (psql):
--   SELECT * FROM current_inventory;
--   SELECT product_id, location_id, SUM(quantity_delta) FROM inventory_movements GROUP BY product_id, location_id;

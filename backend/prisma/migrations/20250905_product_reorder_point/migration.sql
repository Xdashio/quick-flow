-- Add reorder_point column to products table
-- Null means the product isn't tracked for low-stock alerts.
-- When set, the product surfaces on GET /inventory/low-stock once total
-- stock across all locations falls at or below this value.
ALTER TABLE "products" ADD COLUMN "reorder_point" INTEGER;

-- Buying/cost price tracking, for profit reporting.

ALTER TABLE "products"
  ADD COLUMN "cost_cents" INTEGER;

ALTER TABLE "transaction_line_items"
  ADD COLUMN "unit_cost_cents" INTEGER;

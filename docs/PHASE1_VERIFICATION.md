# Phase 1 Verification — Real DB + Real API (Anti-Mock)

All endpoints hit real PostgreSQL via Prisma `@prisma/adapter-pg`, no in-memory arrays.

## 1. Create product + barcode lookup

```bash
POST /api/products
{"sku":"SKU-TEST-001","barcode":"012345678905","name":"Test Maize Flour 2kg","priceCents":25000,"taxCategoryId":"da3a04a4-ea73-44ef-8c3e-34c08459cc43"}
→ 201 {"id":"2c814a43-6336-42d0-b58d-7996ed58f95a","sku":"SKU-TEST-001","barcode":"012345678905","priceCents":25000}

GET /api/products/barcode/012345678905
→ 200 {"id":"2c814a43-...","barcode":"012345678905",...}
```

psql:
```
SELECT id, sku, barcode, price_cents FROM products WHERE sku='SKU-TEST-001';
-- 2c814a43... | SKU-TEST-001 | 012345678905 | 25000
```

## 2. Transaction DRAFT → IN_PROGRESS → COMPLETED

```bash
POST /api/transactions {"id":"7e45138a-...","locationId":"61978774-...","cashierId":"900f4564-...","status":"DRAFT","subtotalCents":65000,"taxCents":0,"totalCents":65000,"lineItems":[...2 items...]}
→ 201 {"status":"DRAFT","lineItems":[...]}
PATCH /api/transactions/7e45138a... {"status":"IN_PROGRESS"} → 200 {"status":"IN_PROGRESS"}
PATCH ... {"status":"COMPLETED"} → 200 {"status":"COMPLETED"}
# Full path also verified: DRAFT→IN_PROGRESS→AWAITING_PAYMENT→PAYMENT_CAPTURED→COMPLETED→REFUND_REQUESTED→REFUNDED
```

## 3. Illegal transition rejected (guard)

```bash
PATCH /api/transactions/7e45138a... {"status":"DRAFT"} (from COMPLETED)
→ 400 {"message":"Illegal transition COMPLETED → DRAFT. Allowed from COMPLETED: REFUND_REQUESTED, VOID_REQUESTED"}

PATCH VOIDED→IN_PROGRESS → 400 "Illegal transition VOIDED → IN_PROGRESS. Allowed from VOIDED: (terminal – no outgoing transitions)"
PATCH COMPLETED→VOIDED → 400 "Illegal transition COMPLETED → VOIDED..."
```

## 4. Inventory ledger + materialized view

```bash
POST /api/inventory/movements {"productId":"2c814a43-...","locationId":"61978774-...","quantityDelta":100,"reason":"receiving"} → {"currentStock":{"quantity":"100"}}
POST ... {"quantityDelta":-2,"reason":"sale"} → {"currentStock":{"quantity":"98"}}
GET /api/inventory/current/2c814a43-... → [{"quantity":"98"}]
# Weighed: NUMERIC(10,3)
POST ... {"quantityDelta":50.750,"reason":"receiving"} → 50.75 ; GET → 50.75
```

psql:
```
SELECT * FROM current_inventory;
-- 2c814a43... | 61978774... | 98.000
-- 0f12e3d8... | 61978774... | 50.750
SELECT product_id, SUM(quantity_delta) FROM inventory_movements GROUP BY product_id;
-- matches current_inventory
```

## Anti-mock proof

- Every controller injects PrismaService (real adapter-pg) — no hardcoded arrays.
- `transactions.service.ts:19` — explicit ALLOWED_TRANSITIONS map + assertTransition.
- `inventory.service.ts:35` — `REFRESH MATERIALIZED VIEW CONCURRENTLY current_inventory` after each movement.
- `products.service.ts` — Prisma create/findUnique/findMany with taxCategory include.
```

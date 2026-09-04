# Point of Sale System — Technical Blueprint
**Target:** Single-location retail/grocery | Kenya | M-Pesa-first, no cards for now | Greenfield build | Small team

---

## 0. Framing the Problem

A retail/grocery POS for a single Kenyan location, greenfield, has a specific character that should drive every downstream decision:

- **No legacy integration debt** — we can pick the stack that's *right*, not the stack that's *compatible*.
- **Single location** means we don't need multi-tenant data isolation or cross-store inventory reconciliation on day one — but we should not architect ourselves into a corner if the owner opens a second location in 18 months. Cheap insurance: model `location_id` everywhere from day one, even if there's only ever one row in the `locations` table.
- **Retail/grocery** (vs. restaurant) means: SKU/barcode-first workflows, weight-based pricing (produce, deli), variable-quantity items, high item-count baskets, and — critically — **the checkout line cannot stop for network issues**. Offline tolerance is not a nice-to-have here, it's existential. A grocery store with a frozen POS during a network blip loses a physical line of angry customers, not just a transaction.
- **M-Pesa-first, no cards** changes the payment story completely from the original card-centric draft. There's no PCI-DSS burden (huge simplification), but M-Pesa's STK Push flow is itself an online-only API call to Safaricom's Daraja platform — so "offline payment" is arguably a *harder* problem than offline card payment was, not an easier one. See §2.4 and §5.4 for how this actually gets handled.
- **Kenyan tax compliance** means KRA VAT rules and, critically, **eTIMS** (the mandatory electronic invoicing system) — this isn't optional paperwork, it's a legal requirement for issuing valid tax invoices in Kenya as of the current regime. See §2.3.

Everything below is scoped to that reality. I'm not going to hedge toward enterprise multi-tenant SaaS patterns you don't need yet, and I've stripped out the card/PCI machinery from the original draft since it doesn't apply to your launch scope.

---

## 1. High-Level Architecture

### Description (for diagramming)

```
┌─────────────────────────────────────────────────────────────┐
│                     REGISTER (Client)                        │
│  ┌───────────────┐  ┌────────────────┐  ┌─────────────────┐  │
│  │  POS Frontend │  │  Local SQLite   │  │  Hardware Layer │  │
│  │  (Electron/   │◄─┤  (offline store,│  │  (printer,      │  │
│  │   Tauri app)  │  │   write-ahead)  │  │   scanner, cash │  │
│  │               │  │                 │  │   drawer)       │  │
│  └───────┬───────┘  └────────┬────────┘  └─────────────────┘  │
│          │                   │                                │
│          │         ┌─────────▼─────────┐                      │
│          │         │  Sync Agent        │                      │
│          │         │  (background)      │                      │
│          └────────►│  queue + retry     │                      │
│                    └─────────┬──────────┘                      │
└──────────────────────────────┼──────────────────────────────────┘
                                │  HTTPS (when online)
                    ┌───────────▼───────────┐
                    │   Backend API (REST)  │
                    │   - Auth service      │
                    │   - Transaction svc   │
                    │   - Inventory svc     │
                    │   - Tax engine        │
                    │   - Reporting svc     │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │   PostgreSQL (primary)│
                    │   + read replica for  │
                    │     reporting          │
                    └───────────┬───────────┘
                                │
                ┌───────────────┼───────────────┬───────────────┐
                ▼               ▼               ▼               ▼
        ┌──────────────┐ ┌────────────┐ ┌──────────────┐ ┌──────────────┐
        │ M-Pesa Daraja │ │ Manager    │ │ Object storage│ │ KRA eTIMS    │
        │ API (STK Push,│ │ Dashboard  │ │ (receipts,    │ │ (tax invoice │
        │ C2B callback) │ │ (web app)  │ │  reports PDF) │ │  submission) │
        └──────────────┘ └────────────┘ └──────────────┘ └──────────────┘
```

**Key architectural decision:** the register is *not* a thin client. It's a local-first application with its own database and business logic, that syncs to a central backend opportunistically. The backend is the source of truth *eventually*, not *immediately*. This single decision shapes almost everything else — schema design (need local IDs that reconcile), conflict resolution strategy, and even UI patterns (need to show sync status without alarming the cashier).

### Component responsibilities

| Component | Responsibility | Runs when offline? |
|---|---|---|
| POS Frontend | Checkout UI, cart logic, hardware calls | Yes — full functionality |
| Local DB (SQLite) | Product catalog cache, pending transactions, session state | Yes — is the source of truth locally |
| Sync Agent | Push pending transactions, pull catalog/price updates | No — queues until online |
| Backend API | Auth, canonical transaction log, inventory truth, tax rules | N/A (server-side) |
| Manager Dashboard | Reporting, inventory management, user management | No — needs connectivity (acceptable, it's not the checkout line) |
| M-Pesa Daraja API | STK Push, C2B payment confirmation | No — requires connectivity, see §2.4 |
| eTIMS integration | KRA tax invoice submission | No — queued and submitted once online, see §2.3 |

---

## 2. Backend & Logic Deep-Dive

### 2.1 Transaction Processing

The core entity is not "Sale" — it's a **transaction state machine**. Model it explicitly:

```
DRAFT → IN_PROGRESS → AWAITING_PAYMENT → PAYMENT_CAPTURED → COMPLETED
                                        ↘ PAYMENT_FAILED → VOIDED
COMPLETED → REFUND_REQUESTED → REFUNDED (partial or full)
COMPLETED → VOID_REQUESTED → VOIDED (same-day only, different from refund)
```

Why this matters: a naive implementation treats "sale" as a single INSERT at the end of checkout. That breaks the moment you need to:
- Recover from a payment terminal timeout (did it charge or not?)
- Support "hold this order" workflows (customer forgot their wallet, comes back in 10 min)
- Reconcile a drawer at end-of-day against what the state machine says happened vs. what actually got captured by the processor

**Line items are immutable once the transaction is COMPLETED.** Refunds and voids are new records referencing the original transaction, never mutations of it. This is non-negotiable for audit integrity and will save you enormously when you eventually need to explain a discrepancy to an accountant or auditor.

**Idempotency:** every transaction gets a client-generated UUID at DRAFT time, not a server-assigned auto-increment ID. This is what makes offline-then-sync safe — if the sync agent retries a push after a network blip, the backend can dedupe on that UUID instead of creating a duplicate sale.

### 2.2 Inventory Management

Two competing pressures: **accuracy** (manager needs to trust the number) vs. **availability** (register can't block on inventory lock contention during a lunch rush).

Approach:
- **Eventual consistency for stock counts.** The register decrements a *local* cached stock count immediately for UI purposes (so it can warn "low stock" or block negative-stock sales if configured), but the authoritative decrement happens server-side when the transaction syncs.
- **Reserve, don't lock.** For a single-register single-location setup this is less critical than multi-register, but design for it now: if you add a second register later, you don't want two cashiers to both sell the last unit of something because both had stale local caches. Server-side inventory decrements should be atomic (`UPDATE inventory SET quantity = quantity - :n WHERE product_id = :id AND quantity >= :n`) with a check for negative-stock policy.
- **Grocery-specific: weight-based / bulk items.** Your inventory model needs a `unit_type` (each, kg, lb, oz) and a `is_weighed` flag, because a scale-integrated barcode (many grocery barcodes encode weight/price in the barcode itself, e.g. UPC-A with embedded price) needs different cart-line logic than a fixed-price SKU.
- **Receiving/stock-in** is a first-class workflow, not an afterthought — POs, supplier receiving, and shrinkage/waste write-offs all touch the same inventory ledger. Model inventory changes as an append-only ledger (`inventory_movements` table) with a `reason` enum (sale, return, receiving, shrinkage, manual_adjustment, waste) rather than just mutating a `quantity` column directly. This gives you a full audit trail and makes "why is this number wrong" answerable in seconds instead of a mystery.

### 2.3 Tax Calculation — Kenya VAT + eTIMS

This is a materially bigger deal in Kenya than the generic "sales tax" story in most POS tutorials, because of two intersecting requirements:

**VAT structure:**
- Standard rate is **16%** on most goods.
- Some categories are zero-rated (0% but still VAT-registered, e.g. certain basic foodstuffs, exports) and some are VAT-exempt entirely (different from zero-rated for input-VAT-claim purposes — matters for the owner's accountant even if not for your checkout logic).
- Build the same config-driven `tax_categories` model as the original draft (taxable-standard, zero-rated, exempt), but the *rates and category assignments must be admin-editable*, not hardcoded — KRA has changed the VAT rate before (16% → 14% → 16% over recent years) and will again.

**eTIMS (Electronic Tax Invoice Management System) — this is the part that's easy to underestimate:**
- KRA requires VAT-registered businesses to issue **eTIMS-compliant tax invoices** for sales — this isn't just "print a receipt," it means every qualifying sale needs to be reported to KRA's system (in near-real-time or in a defined submission window depending on which eTIMS integration model you use) and the receipt must carry a KRA-issued invoice/control number and QR code.
- There are a few integration paths: **OSCU (Online Sales Control Unit)** for online/real-time submission, **VSCU (Virtual Sales Control Unit)** for businesses using a virtual device via an approved software/hardware vendor, and simplified options for small taxpayers. Given you're building custom software, **VSCU via KRA's eTIMS API is the realistic path** — you integrate directly rather than buying a certified physical ETR (Electronic Tax Register) device.
- **Critical implication for offline design:** exactly like M-Pesa (§2.4), eTIMS submission requires connectivity. Design it the same way — the sale completes and prints a receipt locally immediately (cashier and customer don't wait), the eTIMS submission is queued and fires when connectivity returns, and the *invoice number becomes final only once eTIMS confirms it*. Print a provisional receipt offline, with a note that a compliant tax invoice will follow, or reprint the final one once synced — this is a real operational workflow other Kenyan retailers already live with, not a corner case you're inventing.
- Verify current eTIMS onboarding requirements directly against KRA's eTIMS portal before building the integration — this is exactly the kind of regulatory detail that shifts and where I'd rather you confirm against the primary source than build against my summary of it.
- Tax must still be calculated and **frozen onto the transaction at time of sale**, same principle as before — never recompute historical tax from current rules.

### 2.4 Offline Capabilities

This is the hardest and most important part of the system, so it deserves real depth.

**What must work fully offline:**
- Product lookup/scan (from local cached catalog)
- Cart building, discounts, price overrides
- Cash payment completion
- Receipt printing
- Local inventory decrement (soft, reconciled later)

**What's degraded offline:**
- M-Pesa payments — see below, this is the genuinely hard part, arguably harder than card-offline would have been
- eTIMS tax invoice submission (§2.3) — sale completes locally, invoice number finalizes on sync
- Real-time inventory truth across multiple registers (not your problem at single-location-single-register, becomes relevant later)
- Manager dashboard / reporting (acceptable to require connectivity)

**M-Pesa payments while offline** is the crux issue, and it's structurally different from the card-offline problem in the original draft — there's no "offline authorization mode" for M-Pesa, because the whole mechanism *is* an API round-trip to Safaricom. Two real integration patterns, with different offline implications:

1. **STK Push (Lipa Na M-Pesa Online / "Lipa na M-Pesa"):** your backend calls the Daraja API, which pushes a payment prompt directly to the customer's phone; they enter their M-Pesa PIN, and Safaricom calls your callback URL with the result. **This requires your backend to have live internet at the moment of the transaction** — there is no queuing this for later, since the whole point is a real-time prompt to the customer's phone. If your location's internet is down, STK Push is simply unavailable in that moment.
2. **Till Number / Paybill manual flow (C2B):** the customer initiates payment themselves from their own M-Pesa menu (Lipa na M-Pesa → Buy Goods, entering your Till Number and the amount), gets an SMS confirmation, and shows the cashier the confirmation message/code. Your system either (a) receives Safaricom's C2B confirmation callback if your backend is online, or (b) the cashier manually records the M-Pesa transaction code shown on the customer's phone and the system reconciles it against Safaricom's statement later. **This can function even if your POS register itself is offline**, because the actual money movement happens between the customer's phone and Safaricom regardless of your system's connectivity — your system just needs to eventually confirm and reconcile it.

**Recommendation for MVP:** build STK Push as the primary flow (best UX — cashier enters amount, customer just approves on their phone), with **Till Number manual-entry-and-reconcile as the offline fallback** — the cashier records the M-Pesa code, marks the sale as "payment pending confirmation," and the sync agent reconciles it against the Daraja transaction status/C2B callback once connectivity returns. This mirrors the cash-offline pattern much more than it mirrors the card-offline pattern: **the payment itself doesn't fail offline, only your system's confirmation of it is delayed** — which is a much better position to be in than the original card-offline dilemma.

Same recommendation on cellular failover as before: for a single retail location, a 4G/LTE failover router is cheap insurance and meaningfully increases how often STK Push (the better UX) stays available, rather than falling back to the manual Till flow.

**Sync conflict resolution:** with a single register, true conflicts are rare (no two devices editing the same transaction). The main sync concern is catalog/price updates — if a manager changes a price on the dashboard while the register is offline, the register should use its last-cached price until it successfully syncs, then a price change mid-cart-build should NOT retroactively change items already in an open cart (would be confusing and could look like a bait-and-switch to the customer).

---

## 3. Database Schema Design

Core tables (PostgreSQL for the backend; a subset mirrors into SQLite on the register):

```sql
-- Product catalog
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(64) UNIQUE NOT NULL,
    barcode VARCHAR(64),               -- UPC/EAN, indexed for scan lookup
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit_type VARCHAR(16) NOT NULL DEFAULT 'each',  -- each, kg, lb, oz
    is_weighed BOOLEAN NOT NULL DEFAULT false,
    price_cents INTEGER NOT NULL,      -- store money as integer cents, never float
    tax_category_id UUID REFERENCES tax_categories(id),
    category_id UUID REFERENCES product_categories(id),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_barcode ON products(barcode);

CREATE TABLE tax_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(64) NOT NULL,          -- 'standard', 'grocery-exempt', 'prepared-food'
    rate_bp INTEGER NOT NULL            -- basis points, e.g. 825 = 8.25%
);

-- Inventory as an append-only ledger, not a mutable counter
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    location_id UUID REFERENCES locations(id),
    quantity_delta NUMERIC(10,3) NOT NULL,  -- signed; NUMERIC to support weighed items
    reason VARCHAR(32) NOT NULL,        -- sale, return, receiving, shrinkage, adjustment, waste
    reference_id UUID,                  -- FK to transaction, PO, etc. depending on reason
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id)
);
-- Current stock is a derived VIEW or materialized aggregate, not a source-of-truth column
CREATE MATERIALIZED VIEW current_inventory AS
    SELECT product_id, location_id, SUM(quantity_delta) AS quantity
    FROM inventory_movements GROUP BY product_id, location_id;

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY,                -- client-generated, for idempotent sync
    location_id UUID REFERENCES locations(id),
    register_id UUID REFERENCES registers(id),
    cashier_id UUID REFERENCES users(id),
    status VARCHAR(24) NOT NULL,        -- see state machine in §2.1
    subtotal_cents INTEGER NOT NULL,
    tax_cents INTEGER NOT NULL,
    total_cents INTEGER NOT NULL,
    customer_id UUID REFERENCES customers(id),  -- nullable, guest checkout allowed
    voided_reason TEXT,
    parent_transaction_id UUID REFERENCES transactions(id), -- for refunds/voids
    created_at TIMESTAMPTZ NOT NULL,    -- client timestamp, authoritative for "when it happened"
    synced_at TIMESTAMPTZ              -- server timestamp, when it landed centrally
);

CREATE TABLE transaction_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id),
    product_id UUID REFERENCES products(id),
    quantity NUMERIC(10,3) NOT NULL,
    unit_price_cents INTEGER NOT NULL,  -- frozen at time of sale, never re-derive from products table
    tax_rate_bp INTEGER NOT NULL,       -- frozen at time of sale
    discount_cents INTEGER NOT NULL DEFAULT 0,
    line_total_cents INTEGER NOT NULL
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id),
    method VARCHAR(16) NOT NULL,        -- cash, mpesa_stk, mpesa_till, store_credit
    amount_cents INTEGER NOT NULL,
    mpesa_receipt_number VARCHAR(32),   -- Safaricom's M-Pesa receipt code (e.g. QK7XXXXXX), the source of truth for reconciliation
    mpesa_phone_number VARCHAR(16),     -- payer's MSISDN, for STK Push tracking
    checkout_request_id VARCHAR(64),    -- Daraja's CheckoutRequestID for STK Push, used to poll/match the callback
    etims_invoice_number VARCHAR(64),   -- populated once eTIMS confirms, nullable until synced
    status VARCHAR(24) NOT NULL         -- pending, awaiting_confirmation, captured, failed, refunded
);

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(32),
    loyalty_points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    pin_hash VARCHAR(255) NOT NULL,     -- PIN-based auth for speed at register, see §5.3
    role VARCHAR(16) NOT NULL,          -- cashier, manager, admin
    active BOOLEAN NOT NULL DEFAULT true
);
```

**Design principles baked into this schema:**
- **Money as integer cents, never floats.** Non-negotiable — floating point rounding errors in financial data are a real, recurring bug class.
- **Line items freeze price and tax rate at time of sale.** Historical transactions must never change value if catalog data changes later.
- **Inventory as an append-only ledger.** Gives you full audit trail and makes reconciliation tractable.
- **`location_id` on everything** even though you have one location today — near-zero cost now, saves a painful migration later.
- **Client-generated UUIDs for transactions** to make offline-sync idempotent.

---

## 4. UI/UX & Design

### 4.1 Checkout speed is the north star metric

Every UI decision for the cashier-facing screen should be evaluated against: *does this add friction to a repetitive, time-pressured motion?* A cashier scans 40-80 items in a normal grocery basket. Small frictions compound.

- **Scan-first, click-second.** The cart should auto-focus on barcode input at all times; nothing should require clicking into a field before scanning.
- **Large touch targets for manual entry** (produce lookup codes, price overrides) — grocery cashiers often work fast with imprecise finger taps, not careful clicks.
- **No modal dialogs during normal flow.** Confirmation modals ("are you sure?") kill throughput — reserve them only for destructive/high-risk actions (void, large discount, manager override), never for routine steps.
- **Undo, not confirm.** For accidental scans, let the cashier tap the line item and remove it, rather than a confirm-before-add pattern.
- **Running total always visible, large font.** Customers watch this — it's also a trust/transparency signal.

### 4.2 Role-based dashboards

| Role | Primary view | Key permissions |
|---|---|---|
| Cashier | Checkout screen only | Process sales, apply pre-approved discounts, open drawer (with reason code), start returns (manager approval over $X) |
| Manager | Full dashboard: sales reports, inventory, staff scheduling, price management | All cashier permissions + void/refund approval, price changes, end-of-day reconciliation, user management |
| Admin (owner) | Everything + system config | Tax rate config, integrations, user role assignment |

Practically: cashier login should be **PIN-based, not password**, for speed (see §5.3), while manager dashboard access (web-based, likely used less frequently per-session) can use full auth (password + optional 2FA).

### 4.3 Accessibility

- WCAG 2.1 AA as the baseline target for the manager dashboard (web-based, standard accessibility tooling applies cleanly).
- For the register touchscreen UI: high-contrast mode toggle (glare from store lighting is a real, common complaint), adjustable font size, and support for external keyboard/scanner input as a fallback to touch for cashiers with motor impairments.
- Color must never be the *only* signal (e.g., low-stock warnings should have an icon + text, not just a red highlight) — helps colorblind users and is generally better UX under bad lighting anyway.

---

## 5. Hardware Integration

This is where a lot of POS projects get bitten by "should be simple" turning into "vendor-specific driver hell." Some concrete guidance:

### 5.1 Receipt Printers
- Standard is **ESC/POS command protocol** — the de facto standard for thermal receipt printers (Epson, Star Micronics, and most generic thermal printers implement it).
- Connect via USB or, better for flexibility, **network/Ethernet or Bluetooth** — network printers decouple the printer from a specific register's USB port, useful if you ever add a second register or a kitchen/backroom printer.
- Build a **printer abstraction layer** in your code (an interface like `printReceipt(transaction)`) so you're not hardcoding ESC/POS byte sequences into checkout logic — this is the difference between swapping a printer model being a config change vs. a code change.
- **Always have a "reprint last receipt" function** and a **PDF/email receipt fallback** — printers jam, run out of paper mid-rush, and customers increasingly ask for email receipts anyway.

### 5.2 Barcode Scanners
- Cheapest, most robust integration: **USB HID (keyboard emulation) mode** — the scanner just "types" the barcode into whatever field has focus, no custom driver needed. This is why "scan-first, always-focused input" (§4.1) matters architecturally, not just for UX.
- For grocery specifically, make sure your scanner supports the barcode symbologies you'll actually see: UPC-A/UPC-E (most US packaged goods), EAN-13 (many imported goods), and Code 128 (common for internal/PLU labels on produce or deli items).
- **Weight-embedded barcodes**: many grocery scales print a barcode where digits encode both an item code and a price or weight (common in deli/produce). Your barcode-parsing logic needs to detect this format (usually a specific prefix digit) and route to weight-based pricing logic instead of a flat SKU lookup — don't treat all scanned barcodes as flat SKU lookups.

### 5.3 Cash Drawers
- Almost universally triggered via an **RJ11/RJ12 connector wired through the receipt printer** (the printer sends a "kick" pulse) — so drawer integration is usually really "does my printer abstraction layer support the drawer-kick command," not a separate integration.
- **Every drawer-open event must be logged with a reason code** (sale completion, manager override, no-sale/change-making) — this is a basic loss-prevention control that costs nothing to implement and matters enormously for accountability.

### 5.4 M-Pesa Integration (no separate physical terminal needed)
- Unlike card payments, M-Pesa needs no dedicated hardware — it's a pure API integration against Safaricom's **Daraja API**. This actually simplifies your hardware bill of materials versus the original card-terminal plan.
- **Sandbox first, live later (as you specified):** Safaricom's Daraja developer portal gives you sandbox credentials (consumer key/secret, a test shortcode, and test credentials) so you can build and test the full STK Push and C2B flow before ever touching real money. Going live requires a **registered Paybill or Till Number** and a formal go-live application through Safaricom — budget lead time for this, it's not instant.
- Build a thin **M-Pesa service abstraction** in your backend (`initiateSTKPush(amount, phone)`, `handleCallback(payload)`, `queryTransactionStatus(checkoutRequestId)`) so swapping between sandbox and production credentials — or adding a second aggregator later — is a config change, not a rewrite.
- **Consider an aggregator (IntaSend, Pesapal, Flutterwave, etc.) vs. direct Daraja integration:** direct Daraja integration gives you the lowest fees and most control but means you own the Safaricom-specific quirks (callback retries, IP whitelisting for production, C2B registration). An aggregator adds a small margin but handles a lot of that operational overhead and often provides a unified API if you later want to add cards or other mobile money (Airtel Money, etc.). For MVP, **direct Daraja integration is the right call** given your explicit M-Pesa-first, no-cards-yet scope — you're not paying for multi-rail abstraction you don't need.
- **Callback endpoint security matters:** Safaricom calls your public callback URL with payment results — validate the source, use HTTPS, and treat the callback as untrusted input until verified (don't just trust a `status: success` field blindly; cross-check the `CheckoutRequestID` against a pending transaction you actually initiated).

---

## 6. Security & Compliance

### 6.1 No PCI-DSS burden — but M-Pesa and the Kenya Data Protection Act still apply

Since you're not processing cards, **PCI-DSS doesn't apply to this build** — that's a genuine simplification versus the original draft, and one less compliance program to run.

What replaces it:
- **Daraja API credential security:** your consumer key/secret and (in production) your Paybill/Till security credentials are the equivalent of what card data was in the original threat model — treat them with the same rigor. Never commit them to source control, rotate them if you suspect exposure, and keep production credentials fully separate from sandbox.
- **Kenya Data Protection Act, 2019:** you'll be storing customer phone numbers, names, and transaction histories — this puts you squarely under Kenya's data protection regime. Practically: register with the Office of the Data Protection Commissioner (ODPC) if required for your business size/type, have a clear data retention policy, and don't collect more customer PII than the loyalty/receipt features actually need.
- **M-Pesa reconciliation integrity:** because the Till-number manual-entry fallback (§2.4) relies on a cashier typing in a transaction code, that field needs the same audit-logging treatment as a price override or discount — log who entered it, when, and flag any manual M-Pesa entry that doesn't get confirmed by Safaricom's C2B callback or a statement reconciliation within a reasonable window, since that's exactly the kind of gap fraud would exploit.

### 6.2 Data Encryption
- **At rest:** encrypt the database (PostgreSQL supports transparent data encryption at the disk/volume level; use it) and encrypt the local SQLite file on the register (SQLCipher is the standard choice) — the register is a physical device that can be stolen.
- **In transit:** TLS everywhere, no exceptions, including register-to-backend sync traffic.
- **Secrets management:** API keys, DB credentials — use a secrets manager (even something simple like environment-injected secrets via your hosting provider), never hardcoded or committed.

### 6.3 Authentication
- **Cashier-level:** PIN-based login for speed, but PINs should be short-lived-session + auto-logout after inactivity (e.g., 60 seconds idle at checkout screen), and every action should be attributable to a specific user ID even under fast PIN switching (critical for loss-prevention accountability).
- **Manager/admin-level:** full password auth, with 2FA strongly recommended for admin/owner accounts given they control tax config, pricing, and user permissions.
- **Audit logging:** every price override, discount above a threshold, void, and refund should log who did it, when, and why (a required "reason" field, not optional) — this is both a security control and, frankly, the first thing you'll want when investigating a shrinkage discrepancy.

---

## 7. Feature Breakdown: MVP vs. Future

### MVP (needed to actually run the store on day one)
- Barcode scan → cart → checkout flow (cash + M-Pesa STK Push)
- M-Pesa Till Number manual-entry fallback for offline/degraded connectivity
- Offline transaction processing with sync-on-reconnect
- Product catalog management (add/edit/deactivate products, pricing, tax category)
- Basic inventory tracking (stock levels, manual receiving/adjustment)
- Weight-based/PLU item support (produce, deli)
- VAT calculation (config-driven: standard 16%, zero-rated, exempt categories)
- eTIMS integration (VSCU) for compliant tax invoice submission, queued when offline
- Receipt printing + email/SMS receipt option
- Cash drawer integration with reason-coded logging
- PIN-based cashier login, password-based manager login
- Basic end-of-day report (sales total, VAT collected, payment method breakdown, M-Pesa reconciliation status)
- Refund/void workflow with manager approval
- Customer lookup for loyalty/store credit (can be minimal — name/phone lookup)
- Sandbox-to-production M-Pesa credential switch (config-driven, no code change)

### Future Enhancements (post-launch, once core is stable)
- Multi-register support at the same location (introduces real inventory-lock/conflict concerns deferred in §2.2)
- Multi-location support (the `location_id` groundwork pays off here)
- Card payments and/or additional mobile money rails (Airtel Money) via an aggregator, once cards are actually needed
- Full loyalty program (points, tiered rewards, promotions engine)
- Advanced reporting/BI (sales trends, product velocity, shrinkage analysis, staff performance)
- Supplier/PO management integration (automated reordering based on stock thresholds)
- Self-checkout kiosk mode
- Customer-facing display (order confirmation screen, upsell prompts)
- Integration with accounting software (QuickBooks, or local Kenyan options) for automated bookkeeping
- Native mobile manager app (vs. web dashboard)

---

## 8. Technology Stack Recommendations

### Register / POS Frontend
| Option | Pros | Cons |
|---|---|---|
| **Electron + React** (recommended) | Mature offline-first tooling, huge ecosystem, easy hardware access via Node native modules, cross-platform (Windows/Mac/Linux registers) | Heavier resource footprint than native; app size larger |
| **Tauri + React/Svelte** | Much lighter footprint than Electron, faster, uses OS webview | Younger ecosystem, some hardware integration libraries (ESC/POS, USB HID) less mature/battle-tested in Tauri/Rust land |
| Native (Swift/Kotlin per-OS) | Best performance, deepest hardware access | Doubles dev effort if you need cross-platform registers; overkill for single-location MVP |

**Recommendation: Electron + React (plain SPA, not Next.js)** for the register. The ecosystem maturity for hardware integration (`node-thermal-printer`, `node-hid` for scanners) outweighs the resource-footprint downside for a single-register deployment. Next.js's SSR model doesn't map well onto an offline-first desktop app — the available patterns (bundling a Next standalone server as a child process inside Electron, or static-exporting and losing server features) add real complexity for no benefit at checkout, where you want a lean SPA talking to local SQLite. Revisit Tauri once the product is stable if resource usage becomes a real complaint on lower-spec register hardware.

### Manager Dashboard (web app)
**Recommendation: Next.js 16.x (App Router) — and yes, this is an intentional split from the register.** Unlike the register, the dashboard is web-based, connectivity-required anyway, and benefits genuinely from Next.js's routing, SSR, and deployment story (Vercel or self-hosted). This is a good place to use it — just don't force it into the Electron register app (see register rationale above). The prompt pack has been updated to scaffold `/dashboard` as Next.js, not plain React+Vite.

### Local offline database (register-side)
| Option | Pros | Cons |
|---|---|---|
| **SQLite** (recommended) | Zero-config, embedded, rock-solid, SQLCipher gives encryption at rest | Not built for multi-writer concurrency (irrelevant at single-register) |
| PouchDB/CouchDB | Built-in sync protocol to a CouchDB backend | Adds a whole different DB paradigm server-side just to get sync-for-free; more moving parts than needed |

**Recommendation: SQLite** with a custom, purpose-built sync agent. You have full control over conflict resolution logic (which matters given the price-update-mid-cart edge case in §2.4) rather than fighting a generic sync framework's opinions.

### Backend
| Option | Pros | Cons |
|---|---|---|
| **Node.js (NestJS) or Python (FastAPI)** (recommended) | Fast to build, huge ecosystem for payment/tax SDK integrations, easy to hire for | Not the raw performance ceiling of Go/Rust — irrelevant at single-location transaction volumes |
| Go | Excellent performance, great concurrency primitives | Slower initial dev velocity, smaller pool of POS-domain libraries |
| Ruby on Rails | Extremely fast MVP velocity, mature | Less common now for greenfield choices, smaller modern hiring pool |

**Recommendation: FastAPI (Python) or NestJS (TypeScript).** Either is fine — pick based on team familiarity. TypeScript end-to-end (NestJS backend + React frontend) gives you shared type definitions between register and backend, which is a genuine productivity win for a small team.

### Database (backend)
| Option | Pros | Cons |
|---|---|---|
| **PostgreSQL** (recommended) | Best-in-class for relational integrity (critical for financial data), JSONB for flexible fields, mature replication for reporting read-replicas, `NUMERIC` type for exact decimal math | None significant for this use case |
| MySQL | Also solid, slightly less rich type system | No compelling advantage over Postgres here |
| A NoSQL option (Mongo, etc.) | Flexible schema | Actively wrong choice — financial/transactional data with strong relational integrity needs is exactly what relational DBs are built for; you'd be fighting the tool |

**Recommendation: PostgreSQL, unambiguously.** Financial transaction data with strict consistency requirements is the canonical relational-database use case.

### Payments
**Recommendation: Cash + M-Pesa side-by-side, no cards. Direct Safaricom Daraja API integration for M-Pesa.** Cash is first-class (§2.4/§4/§5.3/§7), not a fallback — day-one flow is Barcode scan → Cart → Checkout via **cash (drawer kick + receipt, reason-coded logging) OR M-Pesa STK Push** with Till Number manual-entry fallback when offline/degraded. No PCI burden to manage (§6.1), no separate card terminal hardware needed (§5.4), and direct Daraja integration avoids aggregator margins you don't need at your current scope. Start against Daraja's sandbox environment (free, self-serve via the Safaricom developer portal) and only apply for production Paybill/Till go-live once the sandbox flow is fully wired end-to-end — this is exactly the phased approach you specified.

### Tax Compliance
**Recommendation: eTIMS VSCU integration via KRA's API**, built as its own service module (not entangled with the M-Pesa or transaction logic) since it has its own queuing/retry/offline semantics. Confirm current onboarding steps directly on KRA's eTIMS portal before building, since this is a regulatory integration and details do shift.

### Verified Stack Versions (checked live 2026-09-04)
Pin at scaffold time — don't hardcode a stale major into instructions that may run months later. Verified via `npm view` against the registry:

| Package | Verified stable 2026-09-04 | Minimum / Notes | Architecture impact |
|---|---|---|---|
| **Node.js** | **24.20.0** (Active LTS, host) / 22.x Maintenance | Backend + build tooling requires >=20.19.0 for Prisma 7 | NestJS 12, Prisma 7.10, Next 16 all officially support Node 20/22/24 — verified compatible |
| **NestJS** | **12.0.1** (`@nestjs/core` latest) | 11.x still supported, 12.x is current stable — use 12.x for greenfield | No breaking arch change from 11→12 for REST + TypeORM/Prisma usage |
| **Prisma** | **7.10.0** (`@prisma/client` latest stable) | `prisma` CLI `latest` tag currently points at `8.0.0-rc.12` — **stay on 7.x for production** until 8 GAs | Schema in §3 uses `gen_random_uuid()` / `NUMERIC` — fully compatible with Prisma 7 |
| **PostgreSQL** | **17.x mature / 18.x newest** | 17 if you want max extension/tooling compat, 18 if you want newest — either is safe; verify at https://www.postgresql.org/ at scaffold time | No schema change needed |
| **Next.js** | **16.3.4** (dashboard) | Requires React 19 and Node >=18.17 — satisfied by choices above | Dashboard only — explicitly **not** used inside Electron register (see register rationale) |
| **React** | **19.2.8** | Required by Next 16 | Register SPA + Dashboard share types via `/shared` — both on 19 |
| **Electron** | **44.2.0** | Ships new major ~every 8 weeks — pin to current at scaffold, don't freeze 44 in docs | Bundles its own Node (22.x in Electron 44) — independent of host Node 24 |
| **Vite** | **8.2.2** (register build) | Used for Electron+React SPA (register) | No conflict with Next.js (dashboard has its own bundler) |
| **TypeScript** | **7.0.2** | Strict mode recommended end-to-end (backend + register + dashboard + shared) | Shared types package benefits directly |
| **SQLite / better-sqlite3** | **13.0.3** (`better-sqlite3`) | With SQLCipher for encryption at rest (§6.2) | Local-first register DB — unchanged |

**Decision:** scaffold with the `latest` stable above, but keep version ranges flexible in `package.json` (`^12.0.0` for Nest, `^16.3.0` for Next, `^7.10.0` for Prisma) so `npm install` at build time doesn't fight a stale pin. CI should run `npm outdated` check monthly. If Prisma 8 GAs before you scaffold, re-verify migration notes — 7→8 is the only upcoming major that may need a migration pass.

---

## 9. Potential Pitfalls & Mitigations

| Pitfall | Why it happens | Mitigation |
|---|---|---|
| **Floating-point money bugs** | Using `float`/`double` for prices; rounding errors compound across a shift | Store money as integer cents everywhere, in every layer, no exceptions |
| **Offline sync creates duplicate transactions** | Retry logic re-submits the same sale after a network blip | Client-generated idempotent UUIDs (§2.1), server-side dedup on that key |
| **Inventory drift between physical stock and system count** | Manual adjustments not logged, or race conditions between concurrent writes | Append-only inventory ledger (§2.2/§3), never allow direct `UPDATE` on a quantity column |
| **Tax rules break silently when rates change** | Hardcoded tax logic instead of config-driven rules | Externalize tax config, consider a tax API for jurisdictions with grocery exemption complexity |
| **M-Pesa callback trust bugs** | Treating Safaricom's callback payload as automatically authoritative without matching it to a pending transaction you actually initiated | Always reconcile callbacks against a known `CheckoutRequestID`/pending payment record; never mark a sale paid purely because *a* callback arrived |
| **eTIMS submission treated as an afterthought bolt-on** | Building it last, under deadline pressure, as a thin wrapper | Build it as its own service module from the start with the same queue-and-retry discipline as M-Pesa sync — it has real legal consequences if invoices aren't properly issued |
| **Manual Till-number entry becomes a fraud vector** | Cashier claims a payment was received via M-Pesa but never actually was | Require the M-Pesa transaction code to be logged, audit-trailed, and automatically flagged if not confirmed by Safaricom reconciliation within a set window (§6.1) |
| **Cashier workflow friction kills adoption** | Engineers design for correctness/completeness over speed; too many confirm dialogs | Usability-test the actual checkout flow with a real cashier doing a real 60-item basket before calling it done; treat scan-to-total time as a tracked metric |
| **Hardware integration becomes bespoke spaghetti** | Direct ESC/POS byte-twiddling scattered through checkout code | Printer/scanner/drawer abstraction layers (§5.1) from day one |
| **End-of-day reconciliation doesn't match reality** | Cash drawer opens aren't all logged, or voids/refunds aren't cleanly separated from sales in reporting queries | Reason-coded drawer opens (§5.3), and a transaction state machine (§2.1) that makes "what actually happened" queryable without ad hoc SQL archaeology |
| **Single point of failure: internet + power at one location** | No mitigation plan for outages | Cellular failover for internet (§2.4); a documented manual/paper fallback procedure for total power loss (yes, actually — every retailer needs a "how do we sell things during a blackout" runbook) |
| **Scope creep toward multi-location before MVP ships** | Team over-engineers for a future that isn't real yet | `location_id` everywhere is cheap insurance; multi-register/multi-location *logic* (locking, cross-store reporting) is explicitly deferred to Future Enhancements — resist the urge to build it now |

---

## Suggested Build Sequence

1. Schema + backend API skeleton (transactions, products, inventory ledger)
2. Register app: catalog browsing + cart + local SQLite, no payment yet
3. Barcode scanner integration (USB HID is fast to get working)
4. Cash payment flow + drawer + receipt printing end-to-end
5. Sync agent (this is where offline-first pays for the earlier idempotency design)
6. VAT engine (config-driven rates/categories)
7. M-Pesa Daraja sandbox integration — STK Push first, then Till-number manual fallback
8. eTIMS VSCU integration (sandbox/test mode per KRA's process)
9. Manager dashboard (reporting, inventory, user management, M-Pesa/eTIMS reconciliation views)
10. Refund/void workflows with approval logic
11. Hardening pass: encryption at rest, audit logging, Daraja credential rotation review
12. M-Pesa + eTIMS production go-live application, then cut over from sandbox to live credentials

---

## Can you start the scaffold now?

**Yes — with three things confirmed/gathered first, none of which block starting the code:**

1. **Safaricom Daraja sandbox account** — free, self-serve signup at the Daraja developer portal. You'll get a sandbox Consumer Key/Secret and a test shortcode immediately; this is enough to build and fully test the entire STK Push flow before any real business registration exists.
2. **A decision on backend language** (NestJS/TypeScript vs. FastAPI/Python) — either works, but the agent prompt pack below needs to commit to one so it can wire real code, not pseudocode. I've defaulted to **NestJS + TypeScript end-to-end** in the prompt pack for the shared-types benefit with the React register app — tell me if you'd rather Python.
3. **KRA eTIMS onboarding status** — this can genuinely happen in parallel with early development (phases 1-6 below don't touch it), but you'll want to start the KRA-side registration process now since it involves an external approval step, not just an API key.

Nothing else is a blocker. The scaffold below is designed so phases 1-6 need zero external credentials at all (pure local dev), phase 7 needs only the free Daraja sandbox signup, and phase 8 is the only one gated on an external (KRA) process.

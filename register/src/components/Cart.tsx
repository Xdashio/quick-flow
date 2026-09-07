import React, { useState, useEffect, useRef } from "react";
import type { CartItem, CartTotals } from "../lib/types";
import { formatCurrency, formatTaxRate } from "../lib/cart";
import { IconCart, IconTrash, IconClose, IconPlus, IconMinus, IconArrowRight } from "./icons";

interface CartProps {
  items: CartItem[];
  totals: CartTotals;
  onUpdateQuantity: (id: string, newQty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onOpenTender: () => void;
  onCloseMobileCart?: () => void;
  onApplyDiscount: (id: string, discountCents: number) => void;
  onHoldSale: () => void;
  onRestoreSale: () => void;
  hasHeldSale: boolean;
}

/**
 * Inline two-step confirmation hook.
 * Returns [isPending, arm, reset].
 * Calling arm() sets the pending state and auto-resets after `timeout` ms.
 * Call reset() to cancel manually.
 */
function useConfirm(timeout = 2000) {
  const [isPending, setIsPending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const arm = () => {
    setIsPending(true);
    timerRef.current = setTimeout(() => {
      setIsPending(false);
    }, timeout);
  };

  const reset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsPending(false);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return [isPending, arm, reset] as const;
}

/** Per-item inline remove confirmation */
const CartLineItem: React.FC<{
  item: CartItem;
  onUpdateQuantity: (id: string, newQty: number) => void;
  onRemoveItem: (id: string) => void;
  onApplyDiscount: (id: string, discountCents: number) => void;
}> = ({ item, onUpdateQuantity, onRemoveItem, onApplyDiscount }) => {
  const [confirmPending, armConfirm, resetConfirm] = useConfirm(2000);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountInput, setDiscountInput] = useState("");
  const [discountType, setDiscountType] = useState<"flat" | "pct">("flat");

  const handleRemoveClick = () => {
    if (confirmPending) {
      resetConfirm();
      onRemoveItem(item.id);
    } else {
      armConfirm();
    }
  };

  const handleApplyDiscount = () => {
    const val = parseFloat(discountInput);
    if (isNaN(val) || val < 0) return;
    let cents: number;
    if (discountType === "pct") {
      const pct = Math.min(val, 100) / 100;
      cents = Math.round(item.priceCents * item.quantity * pct);
    } else {
      cents = Math.round(val * 100);
    }
    onApplyDiscount(item.id, cents);
    setDiscountOpen(false);
    setDiscountInput("");
  };

  const handleClearDiscount = () => {
    onApplyDiscount(item.id, 0);
    setDiscountOpen(false);
    setDiscountInput("");
  };

  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: "var(--radius-md)",
        backgroundColor: "var(--bg-surface-elevated)",
        border: `1px solid ${confirmPending ? "var(--accent-rose-border)" : "var(--border-subtle)"}`,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        transition: "border-color 0.2s ease",
      }}
    >
      {/* Top Row: Name and Remove */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>
            {item.name}
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--text-muted)",
              marginTop: 2,
            }}
          >
            {item.sku} · {formatCurrency(item.priceCents)}
            {item.isWeighed ? ` / ${item.unitType}` : ""}
          </div>
        </div>

        {/* Two-step remove button */}
        <button
          onClick={handleRemoveClick}
          title={confirmPending ? "Click again to confirm removal" : "Remove item"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: confirmPending ? 5 : 0,
            background: confirmPending ? "var(--accent-rose-bg)" : "none",
            border: confirmPending ? "1px solid var(--accent-rose-border)" : "none",
            borderRadius: "var(--radius-pill)",
            color: confirmPending ? "var(--accent-rose)" : "var(--text-muted)",
            cursor: "pointer",
            padding: confirmPending ? "3px 9px 3px 7px" : "2px",
            fontSize: 11,
            fontWeight: 700,
            whiteSpace: "nowrap",
            transition: "all 0.18s var(--ease-spring)",
            flexShrink: 0,
          }}
        >
          <IconClose size={confirmPending ? 11 : 14} />
          {confirmPending && <span>Remove?</span>}
        </button>
      </div>

    </div>
  );
};

export const Cart: React.FC<CartProps> = ({
  items,
  totals,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenTender,
  onCloseMobileCart,
  onApplyDiscount,
  onHoldSale,
  onRestoreSale,
  hasHeldSale,
}) => {
  const [clearPending, armClear, resetClear] = useConfirm(2500);
  const totalDiscountCents = items.reduce((sum, i) => sum + (i.discountCents || 0), 0);

  const handleClearClick = () => {
    if (clearPending) {
      resetClear();
      onClearCart();
    } else {
      armClear();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        backgroundColor: "var(--bg-surface)",
        overflow: "hidden",
      }}
    >
      {/* Cart Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <IconCart size={17} />
          <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>
            Current Sale
          </h3>
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "var(--bg-surface-subtle)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {totals.itemCount}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Hold sale button */}
          {items.length > 0 && (
            <button
              onClick={onHoldSale}
              title="Park this sale and start a new one"
              style={{
                display: "flex", alignItems: "center", gap: 4,
                background: "none", border: "1px solid transparent",
                color: "var(--text-muted)", fontSize: 12, fontWeight: 700,
                cursor: "pointer", padding: "4px 10px",
                borderRadius: "var(--radius-pill)",
                transition: "all 0.2s var(--ease-spring)",
                whiteSpace: "nowrap",
              }}
            >
              ⏸ Hold
            </button>
          )}
          {/* Restore held sale button */}
          {hasHeldSale && items.length === 0 && (
            <button
              onClick={onRestoreSale}
              title="Restore held sale"
              style={{
                display: "flex", alignItems: "center", gap: 4,
                background: "var(--accent-amber-bg)",
                border: "1px solid var(--accent-amber-border)",
                color: "var(--accent-amber)", fontSize: 12, fontWeight: 700,
                cursor: "pointer", padding: "4px 10px",
                borderRadius: "var(--radius-pill)",
                whiteSpace: "nowrap",
              }}
            >
              ▶ Restore Sale
            </button>
          )}
          {/* Two-step Clear Cart button */}
          {items.length > 0 && (
            <button
              onClick={handleClearClick}
              title={clearPending ? "Click again to clear all items" : "Clear all line items"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: clearPending ? "var(--accent-rose-bg)" : "none",
                border: clearPending ? "1px solid var(--accent-rose-border)" : "1px solid transparent",
                color: clearPending ? "var(--accent-rose)" : "var(--text-muted)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                padding: "4px 10px",
                borderRadius: "var(--radius-pill)",
                transition: "all 0.2s var(--ease-spring)",
                whiteSpace: "nowrap",
              }}
            >
              <IconTrash size={12} />
              {clearPending ? "Clear all?" : "Clear"}
            </button>
          )}

          {/* Close button for mobile bottom sheet */}
          {onCloseMobileCart && (
            <button
              onClick={onCloseMobileCart}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
              }}
              title="Close cart"
            >
              <IconClose size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Line Items List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px 16px",
        }}
      >
        {items.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              minHeight: 200,
              textAlign: "center",
              color: "var(--text-muted)",
              padding: 24,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "var(--radius-pill)",
                backgroundColor: "var(--bg-surface-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
                color: "var(--text-muted)",
              }}
            >
              <IconCart size={20} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>
              Cart is empty
            </div>
            <div style={{ fontSize: 12, marginTop: 4, lineHeight: 1.45, maxWidth: 220 }}>
              Scan an item barcode or select products from the catalog to build this sale.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((item) => (
              <CartLineItem
                key={item.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={onRemoveItem}
                onApplyDiscount={onApplyDiscount}
              />
            ))}
          </div>
        )}
      </div>

      {/* Financial Summary Ledger Card */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--border-subtle)",
          backgroundColor: "var(--bg-surface-elevated)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {/* Subtotal */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-secondary)" }}>
          <span>Items Subtotal</span>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            {formatCurrency(totals.subtotalCents)}
          </span>
        </div>

        {/* Itemized Tax Breakdown */}
        {totals.taxGroups.map((tg) => (
          <div
            key={tg.taxCategoryId}
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: "var(--text-muted)",
              paddingLeft: 6,
            }}
          >
            <span>
              {tg.name} ({formatTaxRate(tg.rateBp)})
            </span>
            <span style={{ fontFamily: "var(--font-mono)" }}>
              {formatCurrency(tg.taxCents)}
            </span>
          </div>
        ))}

        {/* Total discount row */}
        {totalDiscountCents > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--accent-primary)", fontWeight: 600 }}>
            <span>Discount Applied</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>- {formatCurrency(totalDiscountCents)}</span>
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: "var(--border-subtle)", margin: "2px 0" }} />

        {/* Grand Total — this is the one number a cashier reads aloud and a
            customer squints at from across the counter, further away than
            a typical touchscreen is used, so it needs to dominate the
            footer rather than sit at roughly cart-line-item size. */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <span style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: "-0.01em" }}>
            Total Due
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--accent-primary)",
            }}
          >
            {formatCurrency(totals.grandTotalCents)}
          </span>
        </div>

        {/* Tender Payment Action Button (Pill) */}
        <button
          disabled={items.length === 0}
          onClick={onOpenTender}
          className="pos-btn-pill pos-btn-pill-primary"
          style={{
            width: "100%",
            height: 48,
            marginTop: 4,
            opacity: items.length === 0 ? 0.45 : 1,
            cursor: items.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          <span>Tender Payment</span>
          <IconArrowRight size={15} />
        </button>
      </div>
    </div>
  );
};

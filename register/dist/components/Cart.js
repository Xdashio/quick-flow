import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { formatCurrency, formatTaxRate } from "../lib/cart";
import { IconCart, IconTrash, IconClose, IconArrowRight, IconPause, IconPlay } from "./icons";
/**
 * Inline two-step confirmation hook.
 * Returns [isPending, arm, reset].
 * Calling arm() sets the pending state and auto-resets after `timeout` ms.
 * Call reset() to cancel manually.
 */
function useConfirm(timeout = 2000) {
    const [isPending, setIsPending] = useState(false);
    const timerRef = useRef(null);
    const arm = () => {
        setIsPending(true);
        timerRef.current = setTimeout(() => {
            setIsPending(false);
        }, timeout);
    };
    const reset = () => {
        if (timerRef.current)
            clearTimeout(timerRef.current);
        setIsPending(false);
    };
    useEffect(() => () => { if (timerRef.current)
        clearTimeout(timerRef.current); }, []);
    return [isPending, arm, reset];
}
/** Per-item inline remove confirmation */
const CartLineItem = ({ item, onUpdateQuantity, onRemoveItem, onApplyDiscount }) => {
    const [confirmPending, armConfirm, resetConfirm] = useConfirm(2000);
    const [discountOpen, setDiscountOpen] = useState(false);
    const [discountInput, setDiscountInput] = useState("");
    const [discountType, setDiscountType] = useState("flat");
    const handleRemoveClick = () => {
        if (confirmPending) {
            resetConfirm();
            onRemoveItem(item.id);
        }
        else {
            armConfirm();
        }
    };
    const handleApplyDiscount = () => {
        const val = parseFloat(discountInput);
        if (isNaN(val) || val < 0)
            return;
        let cents;
        if (discountType === "pct") {
            const pct = Math.min(val, 100) / 100;
            cents = Math.round(item.priceCents * item.quantity * pct);
        }
        else {
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
    return (_jsx("div", { style: {
            padding: "12px 14px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--bg-surface-elevated)",
            border: `1px solid ${confirmPending ? "var(--accent-rose-border)" : "var(--border-subtle)"}`,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            transition: "border-color 0.2s ease",
        }, children: _jsxs("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontSize: 13, fontWeight: 600, lineHeight: 1.35 }, children: item.name }), _jsxs("div", { style: {
                                fontFamily: "var(--font-mono)",
                                fontSize: 11,
                                color: "var(--text-muted)",
                                marginTop: 2,
                            }, children: [item.sku, " \u00B7 ", formatCurrency(item.priceCents), item.isWeighed ? ` / ${item.unitType}` : ""] })] }), _jsxs("button", { onClick: handleRemoveClick, title: confirmPending ? "Click again to confirm removal" : "Remove item", style: {
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
                    }, children: [_jsx(IconClose, { size: confirmPending ? 11 : 14 }), confirmPending && _jsx("span", { children: "Remove?" })] })] }) }));
};
export const Cart = ({ items, totals, onUpdateQuantity, onRemoveItem, onClearCart, onOpenTender, onCloseMobileCart, onApplyDiscount, onHoldSale, onRestoreSale, hasHeldSale, }) => {
    const [clearPending, armClear, resetClear] = useConfirm(2500);
    const totalDiscountCents = items.reduce((sum, i) => sum + (i.discountCents || 0), 0);
    const handleClearClick = () => {
        if (clearPending) {
            resetClear();
            onClearCart();
        }
        else {
            armClear();
        }
    };
    return (_jsxs("div", { style: {
            display: "flex",
            flexDirection: "column",
            height: "100%",
            width: "100%",
            backgroundColor: "var(--bg-surface)",
            overflow: "hidden",
        }, children: [_jsxs("div", { style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    borderBottom: "1px solid var(--border-subtle)",
                }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [_jsx(IconCart, { size: 17 }), _jsx("h3", { style: { fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }, children: "Current Sale" }), _jsx("span", { style: {
                                    fontSize: 11,
                                    fontFamily: "var(--font-mono)",
                                    fontWeight: 600,
                                    padding: "2px 8px",
                                    borderRadius: "var(--radius-pill)",
                                    backgroundColor: "var(--bg-surface-subtle)",
                                    color: "var(--text-secondary)",
                                    border: "1px solid var(--border-subtle)",
                                }, children: totals.itemCount })] }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [items.length > 0 && (_jsxs("button", { onClick: onHoldSale, title: "Park this sale and start a new one", style: {
                                    display: "flex", alignItems: "center", gap: 4,
                                    background: "none", border: "1px solid transparent",
                                    color: "var(--text-muted)", fontSize: 12, fontWeight: 700,
                                    cursor: "pointer", padding: "4px 10px",
                                    borderRadius: "var(--radius-pill)",
                                    transition: "all 0.2s var(--ease-spring)",
                                    whiteSpace: "nowrap",
                                }, children: [_jsx(IconPause, { size: 12 }), " Hold Sale"] })), hasHeldSale && items.length === 0 && (_jsxs("button", { onClick: onRestoreSale, title: "Restore held sale", style: {
                                    display: "flex", alignItems: "center", gap: 4,
                                    background: "var(--accent-amber-bg)",
                                    border: "1px solid var(--accent-amber-border)",
                                    color: "var(--accent-amber)", fontSize: 12, fontWeight: 700,
                                    cursor: "pointer", padding: "4px 10px",
                                    borderRadius: "var(--radius-pill)",
                                    whiteSpace: "nowrap",
                                }, children: [_jsx(IconPlay, { size: 12 }), " Restore Sale"] })), items.length > 0 && (_jsxs("button", { onClick: handleClearClick, title: clearPending ? "Click again to clear all items" : "Clear all line items", style: {
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
                                }, children: [_jsx(IconTrash, { size: 12 }), clearPending ? "Clear all?" : "Clear"] })), onCloseMobileCart && (_jsx("button", { onClick: onCloseMobileCart, style: {
                                    background: "none",
                                    border: "none",
                                    color: "var(--text-muted)",
                                    cursor: "pointer",
                                    padding: 4,
                                    display: "flex",
                                    alignItems: "center",
                                }, title: "Close cart", children: _jsx(IconClose, { size: 18 }) }))] })] }), _jsx("div", { style: {
                    flex: 1,
                    overflowY: "auto",
                    padding: "14px 16px",
                }, children: items.length === 0 ? (_jsxs("div", { style: {
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        minHeight: 200,
                        textAlign: "center",
                        color: "var(--text-muted)",
                        padding: 24,
                    }, children: [_jsx("div", { style: {
                                width: 44,
                                height: 44,
                                borderRadius: "var(--radius-pill)",
                                backgroundColor: "var(--bg-surface-subtle)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 12,
                                color: "var(--text-muted)",
                            }, children: _jsx(IconCart, { size: 20 }) }), _jsx("div", { style: { fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }, children: "Cart is empty" }), _jsx("div", { style: { fontSize: 12, marginTop: 4, lineHeight: 1.45, maxWidth: 220 }, children: "Scan an item barcode or select products from the catalog to build this sale." })] })) : (_jsx("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: items.map((item) => (_jsx(CartLineItem, { item: item, onUpdateQuantity: onUpdateQuantity, onRemoveItem: onRemoveItem, onApplyDiscount: onApplyDiscount }, item.id))) })) }), _jsxs("div", { style: {
                    padding: "16px 20px",
                    borderTop: "1px solid var(--border-subtle)",
                    backgroundColor: "var(--bg-surface-elevated)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-secondary)" }, children: [_jsx("span", { children: "Items Subtotal" }), _jsx("span", { style: { fontFamily: "var(--font-mono)", fontWeight: 600 }, children: formatCurrency(totals.subtotalCents) })] }), totals.taxGroups.map((tg) => (_jsxs("div", { style: {
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 12,
                            color: "var(--text-muted)",
                            paddingLeft: 6,
                        }, children: [_jsxs("span", { children: [tg.name, " (", formatTaxRate(tg.rateBp), ")"] }), _jsx("span", { style: { fontFamily: "var(--font-mono)" }, children: formatCurrency(tg.taxCents) })] }, tg.taxCategoryId))), totalDiscountCents > 0 && (_jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--accent-primary)", fontWeight: 600 }, children: [_jsx("span", { children: "Discount Applied" }), _jsxs("span", { style: { fontFamily: "var(--font-mono)" }, children: ["- ", formatCurrency(totalDiscountCents)] })] })), _jsx("div", { style: { height: 1, backgroundColor: "var(--border-subtle)", margin: "2px 0" } }), _jsxs("div", { style: {
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                        }, children: [_jsx("span", { style: { fontSize: 14.5, fontWeight: 700, letterSpacing: "-0.01em" }, children: "Total Due" }), _jsx("span", { style: {
                                    fontFamily: "var(--font-mono)",
                                    fontSize: 36,
                                    fontWeight: 800,
                                    letterSpacing: "-0.02em",
                                    color: "var(--accent-primary)",
                                }, children: formatCurrency(totals.grandTotalCents) })] }), _jsxs("button", { disabled: items.length === 0, onClick: onOpenTender, className: "pos-btn-pill pos-btn-pill-primary", style: {
                            width: "100%",
                            height: 48,
                            marginTop: 4,
                            opacity: items.length === 0 ? 0.45 : 1,
                            cursor: items.length === 0 ? "not-allowed" : "pointer",
                        }, children: [_jsx("span", { children: "Tender Payment" }), _jsx(IconArrowRight, { size: 15 })] })] })] }));
};

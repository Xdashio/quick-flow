import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { formatCurrency, formatTaxRate } from "../lib/cart";
import { IconCart, IconTrash, IconClose, IconPlus, IconMinus, IconArrowRight } from "./icons";
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
const CartLineItem = ({ item, onUpdateQuantity, onRemoveItem }) => {
    const [confirmPending, armConfirm, resetConfirm] = useConfirm(2000);
    const handleRemoveClick = () => {
        if (confirmPending) {
            resetConfirm();
            onRemoveItem(item.id);
        }
        else {
            armConfirm();
        }
    };
    return (_jsxs("div", { style: {
            padding: "12px 14px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--bg-surface-elevated)",
            border: `1px solid ${confirmPending ? "var(--accent-rose-border)" : "var(--border-subtle)"}`,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            transition: "border-color 0.2s ease",
        }, children: [_jsxs("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontSize: 13, fontWeight: 600, lineHeight: 1.35 }, children: item.name }), _jsxs("div", { style: {
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
                        }, children: [_jsx(IconClose, { size: confirmPending ? 11 : 14 }), confirmPending && _jsx("span", { children: "Remove?" })] })] }), _jsxs("div", { style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: 8,
                    borderTop: "1px solid var(--border-subtle)",
                }, children: [_jsxs("div", { className: "pos-stepper-capsule", children: [_jsx("button", { onClick: () => onUpdateQuantity(item.id, item.quantity - (item.isWeighed ? 0.25 : 1)), className: "pos-stepper-btn", children: _jsx(IconMinus, { size: 11 }) }), _jsx("span", { style: {
                                    padding: "0 8px",
                                    fontFamily: "var(--font-mono)",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    minWidth: 26,
                                    textAlign: "center",
                                }, children: item.quantity }), _jsx("button", { onClick: () => onUpdateQuantity(item.id, item.quantity + (item.isWeighed ? 0.25 : 1)), className: "pos-stepper-btn", children: _jsx(IconPlus, { size: 11 }) })] }), _jsx("div", { style: {
                            fontFamily: "var(--font-mono)",
                            fontWeight: 700,
                            fontSize: 14,
                            letterSpacing: "-0.01em",
                        }, children: formatCurrency(item.lineTotalCents) })] })] }));
};
export const Cart = ({ items, totals, onUpdateQuantity, onRemoveItem, onClearCart, onOpenTender, onCloseMobileCart, }) => {
    const [clearPending, armClear, resetClear] = useConfirm(2500);
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
                                }, children: totals.itemCount })] }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [items.length > 0 && (_jsxs("button", { onClick: handleClearClick, title: clearPending ? "Click again to clear all items" : "Clear all line items", style: {
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
                            }, children: _jsx(IconCart, { size: 20 }) }), _jsx("div", { style: { fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }, children: "Cart is empty" }), _jsx("div", { style: { fontSize: 12, marginTop: 4, lineHeight: 1.45, maxWidth: 220 }, children: "Scan an item barcode or select products from the catalog to build this sale." })] })) : (_jsx("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: items.map((item) => (_jsx(CartLineItem, { item: item, onUpdateQuantity: onUpdateQuantity, onRemoveItem: onRemoveItem }, item.id))) })) }), _jsxs("div", { style: {
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
                        }, children: [_jsxs("span", { children: [tg.name, " (", formatTaxRate(tg.rateBp), ")"] }), _jsx("span", { style: { fontFamily: "var(--font-mono)" }, children: formatCurrency(tg.taxCents) })] }, tg.taxCategoryId))), _jsx("div", { style: { height: 1, backgroundColor: "var(--border-subtle)", margin: "2px 0" } }), _jsxs("div", { style: {
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

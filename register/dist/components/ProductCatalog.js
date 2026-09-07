import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useRef } from "react";
import { formatCurrency, formatTaxRate } from "../lib/cart";
import { IconBarcode, IconScale, IconSearch, IconClose, IconFilter } from "./icons";
import { posApi } from "../lib/api";
// ── Category color assignment ───────────────────────────────────────────────
// A rotating set of 7 distinct hues (defined in index.css) gives cashiers a
// fast "which department" visual cue — on the category tabs themselves and
// as a thin edge on every product card in that category. This is separate
// from the single accent color reserved for totals/primary actions: that one
// stays singular so it keeps meaning; navigation needs to be differentiable
// at a glance instead.
const CATEGORY_COLOR_COUNT = 7;
function categoryColorVar(index) {
    return `var(--cat-color-${(index % CATEGORY_COLOR_COUNT) + 1})`;
}
// ── Product image with local cache + placeholder ────────────────────────────
const IMAGE_TILE_HEIGHT = 150;
const ProductImage = ({ product, accentColor }) => {
    const [src, setSrc] = useState(null);
    useEffect(() => {
        if (!product.image_key)
            return;
        let cancelled = false;
        if (product.image_key.startsWith("http://") || product.image_key.startsWith("https://")) {
            setSrc(product.image_key);
        }
        posApi.getImageLocalPath(product.id).then((localPath) => {
            if (cancelled)
                return;
            if (localPath) {
                setSrc(localPath);
            }
        }).catch(() => { });
        return () => { cancelled = true; };
    }, [product.id, product.image_key, product.image_cached_at]);
    if (!src) {
        // Fallback tile for products without a photo. Plain two-letter initials
        // look identical across many real catalogs ("Basmati Rice 1kg" and
        // "Basmati Rice 2kg" both render "BR"), which is exactly the kind of
        // ambiguity that causes a cashier to tap the wrong SKU at speed. To
        // reduce that: show more of the actual name (word-wrapped, not just
        // initials) and tint the tile with the product's category color so it
        // still reads as "this department" even with no artwork.
        return (_jsx("div", { style: {
                width: "100%",
                height: IMAGE_TILE_HEIGHT,
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--bg-surface-subtle)",
                borderLeft: `4px solid ${accentColor}`,
                padding: "10px 12px",
                fontSize: 15,
                fontWeight: 700,
                lineHeight: 1.25,
                color: "var(--text-secondary)",
                letterSpacing: "-0.005em",
                marginBottom: 10,
                userSelect: "none",
                overflow: "hidden",
                border: "1px solid var(--border-subtle)",
                textAlign: "center",
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                alignItems: "center",
                justifyContent: "center",
            }, children: product.name || "?" }));
    }
    return (_jsx("img", { src: src, alt: product.name, loading: "lazy", style: {
            width: "100%",
            height: IMAGE_TILE_HEIGHT,
            objectFit: "contain",
            backgroundColor: "#ffffff",
            padding: 8,
            boxSizing: "border-box",
            borderRadius: "var(--radius-sm)",
            marginBottom: 10,
            borderLeft: `4px solid ${accentColor}`,
            border: "1px solid var(--border-subtle)",
            display: "block",
        }, onError: () => setSrc(null) }));
};
const TAX_FILTERS = [
    { id: "all", label: "All types" },
    { id: "standard", label: "Standard VAT" },
    { id: "zero_exempt", label: "Zero / Exempt" },
    { id: "weighed", label: "Weighed" },
];
export const ProductCatalog = ({ products, categories = [], cartQuantityByProductId = {}, onAddToCart, onBarcodeSubmit, isLoading, }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [selectedCategoryId, setSelectedCategoryId] = useState("all");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const searchInputRef = useRef(null);
    const filterRef = useRef(null);
    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);
    // Close the filter popover on outside click, same pattern as the header
    // overflow menu.
    useEffect(() => {
        if (!isFilterOpen)
            return;
        const handleClick = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [isFilterOpen]);
    // Stable index-based color per category id, independent of filtering/sort.
    const categoryColorById = React.useMemo(() => {
        const map = {};
        categories.forEach((cat, idx) => {
            map[cat.id] = categoryColorVar(idx);
        });
        return map;
    }, [categories]);
    const getProductColor = (p) => (p.category_id && categoryColorById[p.category_id]) || "var(--text-muted)";
    const handleKeyDown = async (e) => {
        if (e.key === "Enter" && searchQuery.trim()) {
            e.preventDefault();
            const code = searchQuery.trim();
            const matched = await onBarcodeSubmit(code);
            if (matched) {
                setSearchQuery("");
            }
        }
    };
    const filteredProducts = products.filter((p) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = !q ||
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            (p.barcode && p.barcode.includes(q));
        if (!matchesQuery)
            return false;
        if (selectedCategoryId !== "all" && p.category_id !== selectedCategoryId)
            return false;
        if (selectedFilter === "all")
            return true;
        if (selectedFilter === "weighed")
            return Boolean(p.is_weighed);
        if (selectedFilter === "standard")
            return (p.tax_category_rate_bp ?? 0) >= 1600;
        if (selectedFilter === "zero_exempt")
            return (p.tax_category_rate_bp ?? 0) === 0;
        return true;
    });
    const activeFilterLabel = TAX_FILTERS.find((f) => f.id === selectedFilter)?.label ?? "All types";
    return (_jsxs("div", { style: {
            display: "flex",
            flexDirection: "column",
            height: "100%",
            padding: "16px 20px",
            overflow: "hidden",
        }, children: [_jsxs("div", { style: { marginBottom: 12 }, children: [_jsxs("div", { style: { display: "flex", gap: 8, position: "relative" }, children: [_jsxs("div", { style: { position: "relative", flex: 1 }, children: [_jsx("span", { style: {
                                            position: "absolute",
                                            left: 16,
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            color: "var(--text-muted)",
                                            display: "flex",
                                            alignItems: "center",
                                            pointerEvents: "none",
                                        }, children: _jsx(IconBarcode, { size: 19 }) }), _jsx("input", { ref: searchInputRef, type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), onKeyDown: handleKeyDown, placeholder: "Scan barcode or search product name / SKU... (Enter to add)", style: {
                                            width: "100%",
                                            height: "var(--touch-min)",
                                            padding: "0 42px 0 48px",
                                            fontFamily: "var(--font-sans)",
                                            fontSize: 15,
                                            backgroundColor: "var(--bg-surface)",
                                            color: "var(--text-primary)",
                                            border: "1px solid var(--border-subtle)",
                                            borderRadius: "var(--radius-pill)",
                                            outline: "none",
                                            boxShadow: "var(--shadow-subtle)",
                                            transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                                        }, onFocus: (e) => {
                                            e.currentTarget.style.borderColor = "var(--border-focus)";
                                            e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-primary-ring)";
                                        }, onBlur: (e) => {
                                            e.currentTarget.style.borderColor = "var(--border-subtle)";
                                            e.currentTarget.style.boxShadow = "var(--shadow-subtle)";
                                        } }), searchQuery && (_jsx("button", { onClick: () => {
                                            setSearchQuery("");
                                            searchInputRef.current?.focus();
                                        }, className: "pos-icon-btn", style: {
                                            position: "absolute",
                                            right: 6,
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            width: 34,
                                            height: 34,
                                            minHeight: 34,
                                            border: "none",
                                            backgroundColor: "transparent",
                                        }, "aria-label": "Clear search", children: _jsx(IconClose, { size: 15 }) }))] }), _jsxs("div", { ref: filterRef, style: { position: "relative", flexShrink: 0 }, children: [_jsx("button", { onClick: () => setIsFilterOpen((v) => !v), className: "pos-icon-btn", title: `Filter: ${activeFilterLabel}`, "aria-label": "Filter by tax type", style: {
                                            position: "relative",
                                            backgroundColor: selectedFilter !== "all" ? "var(--accent-primary-bg)" : undefined,
                                            borderColor: selectedFilter !== "all" ? "var(--accent-primary-border)" : undefined,
                                            color: selectedFilter !== "all" ? "var(--accent-primary)" : undefined,
                                        }, children: _jsx(IconFilter, { size: 16 }) }), isFilterOpen && (_jsx("div", { className: "pos-filter-popover", children: TAX_FILTERS.map((filter) => (_jsxs("button", { onClick: () => {
                                                setSelectedFilter(filter.id);
                                                setIsFilterOpen(false);
                                            }, className: `pos-filter-popover-item ${selectedFilter === filter.id ? "active" : ""}`, children: [filter.label, selectedFilter === filter.id && _jsx("span", { style: { color: "var(--accent-primary)" }, children: "\u2713" })] }, filter.id))) }))] })] }), categories.length > 0 && (_jsxs("div", { style: {
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginTop: 12,
                            overflowX: "auto",
                            scrollbarWidth: "none",
                        }, children: [_jsxs("button", { onClick: () => setSelectedCategoryId("all"), className: `pos-category-chip ${selectedCategoryId === "all" ? "active" : ""}`, children: ["All Items (", products.length, ")"] }), categories.map((cat, idx) => {
                                const color = categoryColorVar(idx);
                                const active = selectedCategoryId === cat.id;
                                return (_jsxs("button", { onClick: () => setSelectedCategoryId(cat.id), className: `pos-category-chip ${active ? "active" : ""}`, style: {
                                        borderBottomColor: active ? color : "transparent",
                                        color: active ? "var(--text-primary)" : "var(--text-muted)",
                                    }, children: [_jsx("span", { "aria-hidden": "true", style: {
                                                display: "inline-block",
                                                width: 7,
                                                height: 7,
                                                borderRadius: "50%",
                                                backgroundColor: color,
                                                marginRight: 6,
                                                verticalAlign: "middle",
                                            } }), cat.name] }, cat.id));
                            })] }))] }), _jsx("div", { style: {
                    flex: 1,
                    overflowY: "auto",
                    paddingRight: 4,
                }, children: isLoading ? (_jsxs("div", { style: {
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: 260,
                        color: "var(--text-muted)",
                        gap: 12,
                    }, children: [_jsx("div", { style: {
                                width: 22,
                                height: 22,
                                border: "2.5px solid var(--border-strong)",
                                borderTopColor: "var(--accent-primary)",
                                borderRadius: "50%",
                                animation: "pos-spin 1s linear infinite",
                            } }), _jsx("span", { style: { fontSize: 13, fontFamily: "var(--font-sans)" }, children: "Loading catalog..." })] })) : filteredProducts.length === 0 ? (_jsxs("div", { style: {
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: 300,
                        padding: 28,
                        borderRadius: "var(--radius-lg)",
                        backgroundColor: "var(--bg-surface)",
                        border: "1px dashed var(--border-subtle)",
                        textAlign: "center",
                    }, children: [_jsx("div", { style: {
                                width: 44,
                                height: 44,
                                borderRadius: "var(--radius-pill)",
                                backgroundColor: "var(--bg-surface-subtle)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "var(--text-muted)",
                                marginBottom: 12,
                            }, children: _jsx(IconSearch, { size: 20 }) }), _jsx("h3", { style: { fontSize: 15, fontWeight: 700, marginBottom: 4 }, children: products.length === 0 ? "No products yet" : "No matching products" }), _jsx("p", { style: { fontSize: 12.5, color: "var(--text-muted)", maxWidth: 360, lineHeight: 1.5 }, children: products.length === 0
                                ? "This till hasn't synced any catalog items yet. Try Sync Now, or check your connection."
                                : `Nothing matched "${searchQuery}". Check the spelling, barcode, or try a different category.` })] })) : (_jsx("div", { className: "pos-catalog-grid", style: {
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(var(--card-min-width), 1fr))",
                        gap: "var(--catalog-gap)",
                        backgroundColor: "var(--border-subtle)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-md)",
                        overflow: "hidden",
                    }, children: filteredProducts.map((p) => {
                        const taxRate = p.tax_category_rate_bp ?? 0;
                        const isStandardTax = taxRate >= 1600;
                        const qtyInCart = cartQuantityByProductId[p.id] ?? 0;
                        const accentColor = getProductColor(p);
                        return (_jsxs("div", { onClick: () => onAddToCart(p), onKeyDown: (e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onAddToCart(p);
                                }
                            }, role: "button", tabIndex: 0, "aria-label": `Add ${p.name}, ${formatCurrency(p.price_cents)}`, className: "pos-product-card-shell", children: [qtyInCart > 0 && (_jsx("span", { className: "pos-card-qty-flag", "aria-hidden": "true", children: qtyInCart })), _jsxs("div", { className: "pos-product-card-inner", children: [_jsxs("div", { style: { marginBottom: 12, flex: 1 }, children: [_jsx(ProductImage, { product: p, accentColor: accentColor }), _jsx("h4", { style: {
                                                        fontSize: 13.5,
                                                        fontWeight: 700,
                                                        lineHeight: 1.35,
                                                        marginBottom: 4,
                                                        letterSpacing: "-0.01em",
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: "vertical",
                                                        overflow: "hidden",
                                                    }, children: p.name }), _jsxs("div", { style: {
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                        fontFamily: "var(--font-mono)",
                                                        fontSize: 10,
                                                        fontWeight: 500,
                                                        color: "var(--text-muted)",
                                                        letterSpacing: "0.01em",
                                                    }, children: [p.sku, Boolean(p.is_weighed) && (_jsxs("span", { style: {
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: 3,
                                                                fontFamily: "var(--font-sans)",
                                                                fontWeight: 700,
                                                                padding: "1px 6px",
                                                                borderRadius: "var(--radius-pill)",
                                                                backgroundColor: "var(--accent-amber-bg)",
                                                                color: "var(--accent-amber)",
                                                            }, children: [_jsx(IconScale, { size: 10 }), p.unit_type] }))] })] }), _jsx("div", { style: {
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                paddingTop: 10,
                                                borderTop: "1px solid var(--border-subtle)",
                                            }, children: _jsxs("div", { style: { display: "flex", alignItems: "baseline", gap: 6 }, children: [_jsx("span", { title: `${formatTaxRate(taxRate)} ${p.tax_category_name || "VAT"}`, "aria-hidden": "true", style: {
                                                            display: "inline-block",
                                                            width: 6,
                                                            height: 6,
                                                            borderRadius: "50%",
                                                            backgroundColor: isStandardTax ? "var(--accent-mineral)" : "var(--accent-sage)",
                                                            flexShrink: 0,
                                                        } }), _jsxs("div", { children: [_jsx("div", { style: {
                                                                    fontFamily: "var(--font-mono)",
                                                                    fontWeight: 800,
                                                                    fontSize: 18,
                                                                    letterSpacing: "-0.02em",
                                                                }, children: formatCurrency(p.price_cents) }), Boolean(p.is_weighed) && (_jsxs("div", { style: { fontSize: 10, color: "var(--text-muted)" }, children: ["per ", p.unit_type] }))] })] }) })] })] }, p.id));
                    }) })) })] }));
};

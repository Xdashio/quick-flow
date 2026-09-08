import React, { useState, useEffect, useRef } from "react";
import type { CachedCategory, CachedProduct } from "../lib/types";
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
function categoryColorVar(index: number): string {
  return `var(--cat-color-${(index % CATEGORY_COLOR_COUNT) + 1})`;
}

// ── Product image with local cache + placeholder ────────────────────────────

const IMAGE_TILE_HEIGHT = 150;

interface ProductImageProps {
  name: string;
  src: string | null;
  accentColor: string;
}

// Pure presentational tile — the parent resolves every src in ONE batch IPC
// call, so cards never each fire their own lookup (no IPC storm, no staggered
// pop-in). decoding="async" keeps image decode off the interaction path.
const ProductImage: React.FC<ProductImageProps> = ({ name, src, accentColor }) => {
  const [failed, setFailed] = useState(false);
  const showImg = Boolean(src) && !failed;

  if (!showImg) {
    // Fallback tile for products without a photo. Plain two-letter initials
    // look identical across many real catalogs ("Basmati Rice 1kg" and
    // "Basmati Rice 2kg" both render "BR"), which is exactly the kind of
    // ambiguity that causes a cashier to tap the wrong SKU at speed. To
    // reduce that: show more of the actual name (word-wrapped, not just
    // initials) and tint the tile with the product's category color so it
    // still reads as "this department" even with no artwork.
    return (
      <div
        style={{
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
          WebkitBoxOrient: "vertical" as const,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {name || "?"}
      </div>
    );
  }

  return (
    <img
      src={src as string}
      alt={name}
      loading="lazy"
      decoding="async"
      draggable={false}
      style={{
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
      }}
      onError={() => setFailed(true)}
    />
  );
};

interface ProductCatalogProps {
  products: CachedProduct[];
  categories?: CachedCategory[];
  /** productId -> quantity currently in the cart (non-weighed lines only) */
  cartQuantityByProductId?: Record<string, number>;
  onAddToCart: (product: CachedProduct) => void;
  onBarcodeSubmit: (barcode: string) => Promise<boolean>;
  isLoading: boolean;
}

const TAX_FILTERS = [
  { id: "all", label: "All types" },
  { id: "standard", label: "Standard VAT" },
  { id: "zero_exempt", label: "Zero / Exempt" },
  { id: "weighed", label: "Weighed" },
];

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  categories = [],
  cartQuantityByProductId = {},
  onAddToCart,
  onBarcodeSubmit,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [lowStockMap, setLowStockMap] = useState<Record<string, number>>({});
  // productId -> resolved <img> src (remote URL or cached file:// path).
  // Resolved ONCE per catalog load in a single batch IPC call — never per card.
  const [imageSrcById, setImageSrcById] = useState<Record<string, string>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Fetch low-stock data once on mount; refresh every 90s
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const map = await posApi.getLowStock();
      if (alive) setLowStockMap(map);
    };
    load();
    const timer = setInterval(load, 90_000);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  // Close the filter popover on outside click, same pattern as the header
  // overflow menu.
  useEffect(() => {
    if (!isFilterOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isFilterOpen]);

  // Resolve every card image in one batch: remote URLs map directly, local
  // cache resolves via a single IPC round-trip. Runs only when the catalog
  // itself reloads (sync), not on cart/search keystrokes.
  useEffect(() => {
    let cancelled = false;
    const remote: Record<string, string> = {};
    const needsLookup: string[] = [];
    for (const p of products) {
      if (
        typeof p.image_key === "string" &&
        (p.image_key.startsWith("http://") || p.image_key.startsWith("https://"))
      ) {
        remote[p.id] = p.image_key;
      } else if (p.image_key) {
        needsLookup.push(p.id);
      }
    }
    if (needsLookup.length === 0) {
      setImageSrcById(remote);
      return;
    }
    posApi
      .getImageLocalPaths(needsLookup)
      .then((map) => {
        if (cancelled) return;
        const merged: Record<string, string> = { ...remote };
        for (const [id, localPath] of Object.entries(map)) {
          if (localPath) merged[id] = localPath;
        }
        setImageSrcById(merged);
      })
      .catch(() => {
        if (!cancelled) setImageSrcById(remote);
      });
    return () => {
      cancelled = true;
    };
  }, [products]);

  // Stable index-based color per category id, independent of filtering/sort.
  const categoryColorById = React.useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((cat, idx) => {
      map[cat.id] = categoryColorVar(idx);
    });
    return map;
  }, [categories]);

  const getProductColor = (p: CachedProduct): string =>
    (p.category_id && categoryColorById[p.category_id]) || "var(--text-muted)";

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      e.preventDefault();
      const code = searchQuery.trim();
      const matched = await onBarcodeSubmit(code);
      if (matched) {
        setSearchQuery("");
      }
    }
  };

  const filteredProducts = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q));

      if (!matchesQuery) return false;

      if (selectedCategoryId !== "all" && p.category_id !== selectedCategoryId) return false;

      if (selectedFilter === "all") return true;
      if (selectedFilter === "weighed") return Boolean(p.is_weighed);
      if (selectedFilter === "standard") return (p.tax_category_rate_bp ?? 0) >= 1600;
      if (selectedFilter === "zero_exempt") return (p.tax_category_rate_bp ?? 0) === 0;

      return true;
    });
  }, [products, searchQuery, selectedCategoryId, selectedFilter]);

  const activeFilterLabel = TAX_FILTERS.find((f) => f.id === selectedFilter)?.label ?? "All types";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "16px 20px",
        overflow: "hidden",
      }}
    >
      {/* Search & Barcode Scan Bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, position: "relative" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                pointerEvents: "none",
              }}
            >
              <IconBarcode size={19} />
            </span>

            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Scan barcode or search product name / SKU... (Enter to add)"
              style={{
                width: "100%",
                height: "var(--touch-min)",
                padding: "0 42px 0 48px",
                fontFamily: "var(--font-sans)",
                fontSize: 15,
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                outline: "none",
                boxShadow: "none",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--border-focus)";
                e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-primary-ring)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />

            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                className="pos-icon-btn"
                style={{
                  position: "absolute",
                  right: 6,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 34,
                  height: 34,
                  minHeight: 34,
                  border: "none",
                  backgroundColor: "transparent",
                }}
                aria-label="Clear search"
              >
                <IconClose size={15} />
              </button>
            )}
          </div>

          {/* Tax/type filter — moved off the primary hot path. A cashier
              mid-sale essentially never needs to filter by VAT category
              while a customer is waiting; this is a compliance/back-office
              lookup, so it now lives behind an icon button instead of a
              permanently-visible control competing with category
              navigation. */}
          <div ref={filterRef} style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => setIsFilterOpen((v) => !v)}
              className="pos-icon-btn"
              title={`Filter: ${activeFilterLabel}`}
              aria-label="Filter by tax type"
              style={{
                position: "relative",
                backgroundColor: selectedFilter !== "all" ? "var(--accent-primary-bg)" : undefined,
                borderColor: selectedFilter !== "all" ? "var(--accent-primary-border)" : undefined,
                color: selectedFilter !== "all" ? "var(--accent-primary)" : undefined,
              }}
            >
              <IconFilter size={16} />
            </button>

            {isFilterOpen && (
              <div className="pos-filter-popover">
                {TAX_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => {
                      setSelectedFilter(filter.id);
                      setIsFilterOpen(false);
                    }}
                    className={`pos-filter-popover-item ${selectedFilter === filter.id ? "active" : ""}`}
                  >
                    {filter.label}
                    {selectedFilter === filter.id && <span style={{ color: "var(--accent-primary)" }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Primary navigation: Categories. This is the main way a cashier
            browses when they aren't scanning/searching. Each category gets
            its own color dot — plain uniform tabs are easy to design but
            slower to scan at speed; a consistent color per department is a
            faster visual anchor than the label text alone once a cashier
            has done a few shifts. */}
        {categories.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 12,
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            <button
              onClick={() => setSelectedCategoryId("all")}
              className={`pos-category-chip ${selectedCategoryId === "all" ? "active" : ""}`}
            >
              All Items ({products.length})
            </button>
            {categories.map((cat, idx) => {
              const color = categoryColorVar(idx);
              const active = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`pos-category-chip ${active ? "active" : ""}`}
                  style={{
                    borderBottomColor: active ? color : "transparent",
                    color: active ? "var(--text-primary)" : "var(--text-muted)",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      display: "inline-block",
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      backgroundColor: color,
                      marginRight: 6,
                      verticalAlign: "middle",
                    }}
                  />
                  {cat.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Catalog Grid Area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingRight: 4,
        }}
      >
        {isLoading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: 260,
              color: "var(--text-muted)",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                border: "2.5px solid var(--border-strong)",
                borderTopColor: "var(--accent-primary)",
                borderRadius: "50%",
                animation: "pos-spin 1s linear infinite",
              }}
            />
            <span style={{ fontSize: 13, fontFamily: "var(--font-sans)" }}>
              Loading catalog...
            </span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            style={{
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
                color: "var(--text-muted)",
                marginBottom: 12,
              }}
            >
              <IconSearch size={20} />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
              {products.length === 0 ? "No products yet" : "No matching products"}
            </h3>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", maxWidth: 360, lineHeight: 1.5 }}>
              {products.length === 0
                ? "This till hasn't synced any catalog items yet. Try Sync Now, or check your connection."
                : `Nothing matched "${searchQuery}". Check the spelling, barcode, or try a different category.`}
            </p>
          </div>
        ) : (
          <div
            className="pos-catalog-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(var(--card-min-width), 1fr))",
              gap: "var(--catalog-gap)",
              backgroundColor: "var(--border-subtle)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            {filteredProducts.map((p) => {
              const taxRate = p.tax_category_rate_bp ?? 0;
              const isStandardTax = taxRate >= 1600;
              const qtyInCart = cartQuantityByProductId[p.id] ?? 0;
              const accentColor = getProductColor(p);
              // Stock level: undefined = not tracked, 0 = out of stock, >0 = low stock
              const stockQty = lowStockMap[p.id];
              const isOutOfStock = stockQty !== undefined && stockQty <= 0;
              const isLowStock = stockQty !== undefined && stockQty > 0;

              return (
                <div
                  key={p.id}
                  onClick={() => !isOutOfStock && onAddToCart(p)}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && !isOutOfStock) {
                      e.preventDefault();
                      onAddToCart(p);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Add ${p.name}, ${formatCurrency(p.price_cents)}${
                    isOutOfStock ? " — Out of stock" : isLowStock ? ` — Low stock: ${stockQty} left` : ""
                  }`}
                  className="pos-product-card-shell"
                  style={{ opacity: isOutOfStock ? 0.5 : 1, cursor: isOutOfStock ? "not-allowed" : "pointer" }}
                >
                  {qtyInCart > 0 && (
                    <span className="pos-card-qty-flag" aria-hidden="true">
                      {qtyInCart}
                    </span>
                  )}
                  {/* Stock badges */}
                  {isOutOfStock && (
                    <span style={{
                      position: "absolute", top: 8, left: 8, zIndex: 2,
                      fontSize: 9, fontWeight: 800, letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      padding: "2px 7px", borderRadius: "var(--radius-pill)",
                      backgroundColor: "var(--accent-rose)", color: "#fff",
                    }}>Out of Stock</span>
                  )}
                  {isLowStock && (
                    <span style={{
                      position: "absolute", top: 8, left: 8, zIndex: 2,
                      fontSize: 9, fontWeight: 800, letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      padding: "2px 7px", borderRadius: "var(--radius-pill)",
                      backgroundColor: "var(--accent-amber)", color: "#fff",
                    }}>Low: {stockQty}</span>
                  )}
                  <div className="pos-product-card-inner">
                    <div style={{ marginBottom: 12, flex: 1 }}>
                      <ProductImage name={p.name} src={imageSrcById[p.id] ?? null} accentColor={accentColor} />
                      <h4
                        style={{
                          fontSize: 13.5,
                          fontWeight: 700,
                          lineHeight: 1.35,
                          marginBottom: 4,
                          letterSpacing: "-0.01em",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical" as const,
                          overflow: "hidden",
                        }}
                      >
                        {p.name}
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontFamily: "var(--font-mono)",
                          fontSize: 10,
                          fontWeight: 500,
                          color: "var(--text-muted)",
                          letterSpacing: "0.01em",
                        }}
                      >
                        {p.sku}
                        {Boolean(p.is_weighed) && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                              fontFamily: "var(--font-sans)",
                              fontWeight: 700,
                              padding: "1px 6px",
                              borderRadius: "var(--radius-pill)",
                              backgroundColor: "var(--accent-amber-bg)",
                              color: "var(--accent-amber)",
                            }}
                          >
                            <IconScale size={10} />
                            {p.unit_type}
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: 10,
                        borderTop: "1px solid var(--border-subtle)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span
                          title={`${formatTaxRate(taxRate)} ${p.tax_category_name || "VAT"}`}
                          aria-hidden="true"
                          style={{
                            display: "inline-block",
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: isStandardTax ? "var(--accent-mineral)" : "var(--accent-sage)",
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <div
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontWeight: 800,
                              fontSize: 18,
                              letterSpacing: "-0.02em",
                            }}
                          >
                            {formatCurrency(p.price_cents)}
                          </div>
                          {Boolean(p.is_weighed) && (
                            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                              per {p.unit_type}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
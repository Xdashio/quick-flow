import React, { useState, useEffect, useRef } from "react";
import type { CachedCategory, CachedProduct } from "../lib/types";
import { formatCurrency, formatTaxRate } from "../lib/cart";
import { IconBarcode, IconScale, IconSearch, IconClose, IconPlus } from "./icons";
import { posApi } from "../lib/api";

// ── Product image with local cache + placeholder ────────────────────────────

const IMAGE_TILE_HEIGHT = 150;

interface ProductImageProps {
  product: CachedProduct;
}

const ProductImage: React.FC<ProductImageProps> = ({ product }) => {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!product.image_key) return;

    let cancelled = false;

    if (product.image_key.startsWith("http://") || product.image_key.startsWith("https://")) {
      setSrc(product.image_key);
    }

    posApi.getImageLocalPath(product.id).then((localPath) => {
      if (cancelled) return;
      if (localPath) {
        setSrc(localPath);
      }
    }).catch(() => {/* ignore */});

    return () => { cancelled = true; };
  }, [product.id, product.image_key, product.image_cached_at]);

  if (!src) {
    const initials = product.name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
    return (
      <div
        style={{
          width: "100%",
          height: IMAGE_TILE_HEIGHT,
          borderRadius: "var(--radius-sm)",
          backgroundColor: "var(--bg-surface-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          fontWeight: 800,
          color: "var(--text-muted)",
          letterSpacing: "-0.02em",
          marginBottom: 10,
          userSelect: "none",
          overflow: "hidden",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {initials || "?"}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={product.name}
      loading="lazy"
      style={{
        width: "100%",
        height: IMAGE_TILE_HEIGHT,
        objectFit: "contain",
        backgroundColor: "#ffffff",
        padding: 8,
        boxSizing: "border-box",
        borderRadius: "var(--radius-sm)",
        marginBottom: 10,
        border: "1px solid var(--border-subtle)",
        display: "block",
      }}
      onError={() => setSrc(null)}
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
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

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

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
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
        <div style={{ position: "relative" }}>
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
              borderRadius: "var(--radius-pill)",
              outline: "none",
              boxShadow: "var(--shadow-subtle)",
              transition: "border-color 0.15s ease, box-shadow 0.15s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--border-focus)";
              e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-primary-ring)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
              e.currentTarget.style.boxShadow = "var(--shadow-subtle)";
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

        {/* Primary navigation: Categories. This is the main way a cashier
            browses when they aren't scanning/searching, so it comes first
            and gets the larger, higher-contrast chip treatment. */}
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
            {[{ id: "all", name: `All Items (${products.length})` }, ...categories].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`pos-category-chip ${selectedCategoryId === cat.id ? "active" : ""}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Secondary: tax/type filter — a compact segmented control so it
            doesn't compete visually with category navigation above. */}
        <div style={{ display: "flex", marginTop: 10, overflowX: "auto", scrollbarWidth: "none" }}>
          <div className="pos-segmented">
            {TAX_FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`pos-segmented-btn ${selectedFilter === filter.id ? "active" : ""}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
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

              return (
                <div
                  key={p.id}
                  onClick={() => onAddToCart(p)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onAddToCart(p);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Add ${p.name}, ${formatCurrency(p.price_cents)}`}
                  className="pos-product-card-shell"
                >
                  {qtyInCart > 0 && (
                    <span className="pos-card-qty-flag" aria-hidden="true">
                      {qtyInCart}
                    </span>
                  )}
                  <div className="pos-product-card-inner">
                    {/* Top Row: Tax Tag & Scale indicator */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "var(--radius-pill)",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          backgroundColor: isStandardTax
                            ? "var(--accent-mineral-bg)"
                            : "var(--accent-sage-bg)",
                          color: isStandardTax
                            ? "var(--accent-mineral)"
                            : "var(--accent-sage)",
                          border: `1px solid ${
                            isStandardTax
                              ? "var(--accent-mineral-border)"
                              : "var(--accent-sage-border)"
                          }`,
                        }}
                      >
                        {formatTaxRate(taxRate)} {p.tax_category_name || "VAT"}
                      </span>

                      {Boolean(p.is_weighed) && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 10,
                            fontWeight: 600,
                            padding: "2px 7px",
                            borderRadius: "var(--radius-pill)",
                            backgroundColor: "var(--accent-amber-bg)",
                            color: "var(--accent-amber)",
                          }}
                        >
                          <IconScale size={11} />
                          {p.unit_type}
                        </span>
                      )}
                    </div>

                    {/* Middle: Image, Name */}
                    <div style={{ marginBottom: 12, flex: 1 }}>
                      <ProductImage product={p} />
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
                      {/* SKU shown small/muted — secondary to the name, still
                          available for a cashier double-checking an item */}
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 10,
                          fontWeight: 500,
                          color: "var(--text-muted)",
                          letterSpacing: "0.01em",
                        }}
                      >
                        {p.sku}
                      </div>
                    </div>

                    {/* Bottom: Price & Quick Action */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: 10,
                        borderTop: "1px solid var(--border-subtle)",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontWeight: 800,
                            fontSize: 16,
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

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(p);
                        }}
                        aria-label={`Add ${p.name} to cart`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "0 14px",
                          height: 36,
                          minHeight: 36,
                          borderRadius: "var(--radius-pill)",
                          backgroundColor: "var(--bg-surface-subtle)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-primary)",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <IconPlus size={12} />
                        Add
                      </button>
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
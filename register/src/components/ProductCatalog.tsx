import React, { useState, useEffect, useRef } from "react";
import type { CachedCategory, CachedProduct } from "../lib/types";
import { formatCurrency, formatTaxRate } from "../lib/cart";
import { IconBarcode, IconScale, IconSearch, IconClose, IconPlus } from "./icons";
import { posApi } from "../lib/api";

// ── Product image with local cache + placeholder ────────────────────────────

// Packshot tile height — tall enough that product photos render large.
// Images use `contain` on a white tile (supplier packshots already ship on
// white padding, so it blends) so the full product is always visible instead
// of a cropped slice.
const IMAGE_TILE_HEIGHT = 150;

interface ProductImageProps {
  product: CachedProduct;
}

const ProductImage: React.FC<ProductImageProps> = ({ product }) => {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!product.image_key) return;

    let cancelled = false;

    // Direct HTTP/HTTPS image URL fallback (works in dev & web immediately)
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
    // Initials placeholder — same aesthetic as empty states elsewhere in the app
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
  onAddToCart: (product: CachedProduct) => void;
  onBarcodeSubmit: (barcode: string) => Promise<boolean>;
  isLoading: boolean;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  categories = [],
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
        padding: "18px 20px",
        overflow: "hidden",
      }}
    >
      {/* Search & Barcode Scan Bar */}
      <div style={{ marginBottom: 16 }}>
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
              height: 48,
              padding: "0 42px 0 48px",
              fontFamily: "var(--font-sans)",
              fontSize: 14,
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
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(217, 119, 87, 0.15)";
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
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
              }}
            >
              <IconClose size={15} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
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
          {[
            { id: "all", label: `All Products (${products.length})` },
            { id: "standard", label: "Standard VAT (16%)" },
            { id: "zero_exempt", label: "Zero / Exempt" },
            { id: "weighed", label: "Weighed (Scale)" },
          ].map((filter) => {
            const isActive = selectedFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                style={{
                  padding: "6px 16px",
                  borderRadius: "var(--radius-pill)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  backgroundColor: isActive
                    ? "var(--accent-primary)"
                    : "var(--bg-surface-elevated)",
                  color: isActive
                    ? "var(--accent-primary-text)"
                    : "var(--text-secondary)",
                  border: `1px solid ${
                    isActive ? "transparent" : "var(--border-subtle)"
                  }`,
                  boxShadow: isActive ? "0 2px 6px rgba(217, 119, 87, 0.25)" : "none",
                  transition: "all 0.18s var(--ease-spring)",
                }}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Category Pills */}
        {categories.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            {[{ id: "all", name: "All Categories" }, ...categories].map((cat) => {
              const isActive = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  style={{
                    padding: "5px 14px",
                    borderRadius: "var(--radius-pill)",
                    fontFamily: "var(--font-sans)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    backgroundColor: isActive
                      ? "var(--accent-sage-bg)"
                      : "var(--bg-surface-elevated)",
                    color: isActive
                      ? "var(--accent-sage)"
                      : "var(--text-secondary)",
                    border: `1px solid ${
                      isActive ? "rgba(141, 161, 115, 0.35)" : "var(--border-subtle)"
                    }`,
                    transition: "all 0.18s var(--ease-spring)",
                  }}
                >
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
              Querying local SQLite cache...
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
              {products.length === 0
                ? "No products in local SQLite cache"
                : "No matching products found"}
            </h3>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", maxWidth: 360, lineHeight: 1.5 }}>
              {products.length === 0
                ? "The register queries exclusively against the local SQLite database populated via sync. If the backend has zero products, zero will be shown."
                : `No catalog items matched "${searchQuery}". Verify barcode or SKU.`}
            </p>
          </div>
        ) : (
          <div
            className="pos-catalog-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
              gap: 12,
            }}
          >
            {filteredProducts.map((p) => {
              const taxRate = p.tax_category_rate_bp ?? 0;
              const isStandardTax = taxRate >= 1600;

              return (
                <div
                  key={p.id}
                  onClick={() => onAddToCart(p)}
                  className="pos-product-card-shell"
                >
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
                              ? "rgba(125, 165, 206, 0.25)"
                              : "rgba(141, 161, 115, 0.25)"
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

                    {/* Middle: Image, Name, SKU, Barcode */}
                    <div style={{ marginBottom: 12, flex: 1 }}>
                      <ProductImage product={p} />
                      <h4
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          lineHeight: 1.35,
                          marginBottom: 6,
                          letterSpacing: "-0.01em",
                          /* Clamp to 2 lines so tall cards stay consistent */
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical" as const,
                          overflow: "hidden",
                        }}
                      >
                        {p.name}
                      </h4>
                      {/* SKU row */}
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 10,
                          fontWeight: 500,
                          color: "var(--text-secondary)",
                          letterSpacing: "0.01em",
                          marginBottom: p.barcode ? 2 : 0,
                        }}
                      >
                        {p.sku}
                      </div>
                      {/* Barcode row — muted, ellipsis for long codes */}
                      {p.barcode && (
                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 9.5,
                            fontWeight: 400,
                            color: "var(--text-muted)",
                            letterSpacing: "0.02em",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "100%",
                          }}
                        >
                          {p.barcode}
                        </div>
                      )}
                    </div>


                    {/* Bottom: Price & Quick Action Pill */}
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
                            fontWeight: 700,
                            fontSize: 15,
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
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "5px 12px",
                          borderRadius: "var(--radius-pill)",
                          backgroundColor: "var(--bg-surface-subtle)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-primary)",
                          fontSize: 11.5,
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <IconPlus size={11} />
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
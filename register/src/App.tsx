import { useState, useEffect, useCallback } from "react";
import { posApi } from "./lib/api";
import type { CachedProduct, CartItem, SyncStatus } from "./lib/types";
import { createCartItem, updateItemQuantity, calculateCartTotals, formatCurrency } from "./lib/cart";
import { Header } from "./components/Header";
import { ProductCatalog } from "./components/ProductCatalog";
import { Cart } from "./components/Cart";
import { SyncDrawer } from "./components/SyncDrawer";
import { TenderModal } from "./components/TenderModal";
import { IconCart, IconArrowRight } from "./components/icons";
import { useBarcodeScanner } from "./hooks/useBarcodeScanner";

export default function App() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("pos-theme") as "dark" | "light") || "dark";
  });
  const [products, setProducts] = useState<CachedProduct[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTenderModalOpen, setIsTenderModalOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Sync theme attribute on document root
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("pos-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Load products from local SQLite cache
  const loadProducts = useCallback(async () => {
    try {
      const items = await posApi.getAllProducts();
      setProducts(items);
    } catch (err) {
      console.error("[App] Failed to load products from local SQLite cache:", err);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  // Load initial state and subscribe to background sync updates
  useEffect(() => {
    loadProducts();

    posApi.getSyncStatus().then(setSyncStatus).catch(console.warn);

    const unsubscribe = posApi.onSyncUpdate((status) => {
      setSyncStatus(status);
      loadProducts();
    });

    return () => unsubscribe();
  }, [loadProducts]);

  // Handle manual sync trigger
  const handleTriggerSync = async () => {
    setSyncStatus((prev) => (prev ? { ...prev, status: "syncing" } : null));
    try {
      const result = await posApi.triggerSync();
      setSyncStatus(result);
      await loadProducts();
    } catch (err: any) {
      console.error("[App] Manual sync trigger failed:", err);
    }
  };

  // Add product to cart (or increment quantity if already exists)
  const handleAddToCart = (product: CachedProduct) => {
    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.productId === product.id && !item.isWeighed
      );

      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = updateItemQuantity(
          updated[existingIndex],
          updated[existingIndex].quantity + 1
        );
        return updated;
      }

      const newItem = createCartItem(product, 1);
      return [newItem, ...prevItems];
    });
  };

  // Fast barcode lookup
  const handleBarcodeSubmit = useCallback(async (code: string): Promise<boolean> => {
    try {
      // 1. Check for weight-embedded barcode (e.g. prefix 20, length 13)
      // Format: 20 IIIII PPPPP C
      // IIIII = item code, PPPPP = price or weight, C = checksum
      const isWeightEmbedded = code.startsWith("20") && code.length === 13;
      
      let lookupCode = code;
      let dynamicPriceCents: number | null = null;
      let dynamicWeight: number | null = null;

      if (isWeightEmbedded) {
        // Extract the 5-digit item code
        const itemCode = code.substring(2, 7);
        // Extract the 5-digit payload (price or weight)
        const payloadStr = code.substring(7, 12);
        const payloadValue = parseInt(payloadStr, 10);
        
        lookupCode = itemCode; // We will look up the base product by this 5-digit code
        
        // For simplicity, we treat the payload as price_cents if the product isn't weighed,
        // or as the weight (e.g., in grams or 0.01kg) if it is. We'll decide after lookup.
        // Let's store the raw payload value:
        dynamicPriceCents = payloadValue;
      }

      // Lookup product by barcode (or item code if weight-embedded)
      const product = await posApi.getProductByBarcode(lookupCode);
      if (product) {
        let productToAdd = product;
        let qtyToAdd = 1;

        if (isWeightEmbedded) {
          if (product.is_weighed) {
            // If it's a weighed item, the payload might represent weight e.g., in grams.
            // But if it's price embedded, payload is price. We'll assume the payload is price_cents
            // to make the checkout total correct, or adjust quantity to reflect weight if price_cents is fixed.
            // Let's override the price_cents of the product to the scanned price.
            productToAdd = { ...product, price_cents: dynamicPriceCents! };
          } else {
            // Not explicitly weighed, but we have a dynamic price
            productToAdd = { ...product, price_cents: dynamicPriceCents! };
          }
        }

        handleAddToCart(productToAdd);
        return true;
      }
      return false;
    } catch (err) {
      console.error("[App] Barcode lookup error:", err);
      return false;
    }
  }, [handleAddToCart]);

  // Use the global barcode scanner hook
  useBarcodeScanner(handleBarcodeSubmit);

  // Update line item quantity
  const handleUpdateQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(id);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? updateItemQuantity(item, newQty) : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const totals = calculateCartTotals(cartItems);

  return (
    <div className="pos-shell">
      {/* Top Header Bar */}
      <Header
        syncStatus={syncStatus}
        onTriggerSync={handleTriggerSync}
        onToggleDrawer={() => setIsDrawerOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Container */}
      <div className="pos-main-container">
        {/* Left Pane: Catalog & Search */}
        <main className="pos-catalog-pane">
          <ProductCatalog
            products={products}
            onAddToCart={handleAddToCart}
            onBarcodeSubmit={handleBarcodeSubmit}
            isLoading={isLoadingProducts}
          />
        </main>

        {/* Right Pane: Cart Ledger (Desktop side-by-side, mobile slide-up sheet) */}
        <div className={`pos-cart-pane ${isMobileCartOpen ? "mobile-open" : ""}`}>
          <Cart
            items={cartItems}
            totals={totals}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onOpenTender={() => setIsTenderModalOpen(true)}
            onCloseMobileCart={() => setIsMobileCartOpen(false)}
          />
        </div>
      </div>

      {/* Mobile Sticky Bottom Cart Dock Bar */}
      {cartItems.length > 0 && (
        <div className="pos-mobile-cart-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--bg-surface-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-primary)",
              }}
            >
              <IconCart size={18} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15 }}>
                {formatCurrency(totals.grandTotalCents)}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {totals.itemCount} {totals.itemCount === 1 ? "item" : "items"}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsMobileCartOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 18px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--accent-primary)",
              color: "var(--accent-primary-text)",
              border: "none",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <span>Review Cart</span>
            <IconArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Slide-Over Diagnostics Drawer */}
      <SyncDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        syncStatus={syncStatus}
        onTriggerSync={handleTriggerSync}
      />

      {/* Tender Payment Modal (Replaces browser alert) */}
      <TenderModal
        isOpen={isTenderModalOpen}
        onClose={() => setIsTenderModalOpen(false)}
        totals={totals}
        onCompleteSale={() => {
          handleClearCart();
          setIsMobileCartOpen(false);
        }}
      />
    </div>
  );
}

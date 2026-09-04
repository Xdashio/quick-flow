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
  const [lastSale, setLastSale] = useState<any>(null);

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

    const handleOnline = () => {
      console.log("[App] Network online detected — notifying sync agent");
      posApi.notifyOnline();
      handleTriggerSync();
    };
    window.addEventListener("online", handleOnline);

    return () => {
      unsubscribe();
      window.removeEventListener("online", handleOnline);
    };
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
      const isWeightEmbedded = code.startsWith("20") && code.length === 13;
      
      let lookupCode = code;
      let dynamicPriceCents: number | null = null;

      if (isWeightEmbedded) {
        const itemCode = code.substring(2, 7);
        const payloadStr = code.substring(7, 12);
        const payloadValue = parseInt(payloadStr, 10);
        lookupCode = itemCode;
        dynamicPriceCents = payloadValue;
      }

      const product = await posApi.getProductByBarcode(lookupCode);
      if (product) {
        let productToAdd = product;
        if (isWeightEmbedded) {
          productToAdd = { ...product, price_cents: dynamicPriceCents! };
        }
        handleAddToCart(productToAdd);
        return true;
      }
      return false;
    } catch (err) {
      console.error("[App] Barcode lookup error:", err);
      return false;
    }
  }, []);

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

  const handleCompleteSale = (result: any) => {
    setLastSale(result);
    setCartItems([]);
    setIsMobileCartOpen(false);
    // Refresh sync status to show pendingCount update
    posApi.getSyncStatus().then(setSyncStatus).catch(() => {});
  };

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

      {/* Last sale banner (receipt + drawer kick verification, offline badge) */}
      {lastSale && (
        <div style={{
          margin: "10px 16px 0",
          padding: "10px 14px",
          borderRadius: 10,
          backgroundColor: lastSale.offline ? "rgba(217,119,87,0.12)" : "rgba(141,161,115,0.12)",
          border: `1px solid ${lastSale.offline ? "rgba(217,119,87,0.35)" : "rgba(141,161,115,0.35)"}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 12,
          gap: 12,
          flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              Last sale: {lastSale.transactionId?.substring(0, 8)} · {formatCurrency(totals.grandTotalCents)} → change {formatCurrency(lastSale.changeDueCents ?? 0)}
              {lastSale.offline && <span style={{ background: "#d97757", color: "#fff", padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 800 }}>OFFLINE QUEUED</span>}
              {!lastSale.offline && <span style={{ background: "#8da173", color: "#fff", padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 800 }}>SYNCED</span>}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)" }}>
              payment=cash captured · drawer sale kick {lastSale.drawerKick?.bytesHex || "—"} · receipt {lastSale.receipt?.bytesLength || 0} bytes ({lastSale.receipt?.printerType || "virtual"})
              {lastSale.queued && " · pending_sync → will retry on next sync tick"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {syncStatus?.pendingCount !== undefined && syncStatus.pendingCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: "#d97757" }}>{syncStatus.pendingCount} queued</span>
            )}
            <button
              onClick={() => setLastSale(null)}
              style={{ background: "none", border: "1px solid var(--border-subtle)", borderRadius: 999, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

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
                {syncStatus?.pendingCount ? ` · ${syncStatus.pendingCount} queued` : ""}
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

      {/* Cash Tender Modal — wired to real backend via completeCashSale */}
      <TenderModal
        isOpen={isTenderModalOpen}
        onClose={() => setIsTenderModalOpen(false)}
        items={cartItems}
        totals={totals}
        onCompleteSale={handleCompleteSale}
      />
    </div>
  );
}

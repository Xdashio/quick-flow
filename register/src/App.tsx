import { useState, useEffect, useCallback } from "react";
import { posApi } from "./lib/api";
import type { CachedCategory, CachedProduct, CartItem, SyncStatus } from "./lib/types";
import { createCartItem, updateItemQuantity, calculateCartTotals, formatCurrency } from "./lib/cart";
import { Header } from "./components/Header";
import { ProductCatalog } from "./components/ProductCatalog";
import { Cart } from "./components/Cart";
import { SyncDrawer } from "./components/SyncDrawer";
import { SettingsPanel } from "./components/SettingsPanel";
import { TenderModal } from "./components/TenderModal";
import { Login } from "./components/Login";
import { IconCart, IconArrowRight, IconCheck } from "./components/icons";
import { useBarcodeScanner } from "./hooks/useBarcodeScanner";

export default function App() {
  const [authenticatedUser, setAuthenticatedUser] = useState<{
    id: string;
    name: string;
    role: string;
    token: string;
  } | null>(() => {
    try {
      const stored = localStorage.getItem("pos-user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [products, setProducts] = useState<CachedProduct[]>([]);
  const [categories, setCategories] = useState<CachedCategory[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTenderModalOpen, setIsTenderModalOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

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

  // Load categories from local SQLite cache
  const loadCategories = useCallback(async () => {
    try {
      const items = await posApi.getCategories();
      setCategories(items);
    } catch (err) {
      console.error("[App] Failed to load categories from local SQLite cache:", err);
    }
  }, []);

  // Load initial state and subscribe to background sync updates
  useEffect(() => {
    loadProducts();
    loadCategories();

    posApi.getSyncStatus().then(setSyncStatus).catch(console.warn);

    const unsubscribe = posApi.onSyncUpdate((status) => {
      setSyncStatus(status);
      loadProducts();
      loadCategories();
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
  }, [loadProducts, loadCategories]);

  // Handle manual sync trigger
  const handleTriggerSync = async () => {
    setSyncStatus((prev) => (prev ? { ...prev, status: "syncing" } : null));
    try {
      const result = await posApi.triggerSync();
      setSyncStatus(result);
      await loadProducts();
      await loadCategories();
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

  // Quantity-in-cart per product, so the catalog can flag cards already
  // added — a quick-glance cue that avoids double-scanning at busy tills.
  const cartQuantityByProductId = cartItems.reduce<Record<string, number>>((acc, item) => {
    if (!item.isWeighed) {
      acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
    }
    return acc;
  }, {});

  const handleCompleteSale = (result: any) => {
    // Capture the total at the moment of sale — cartItems (and therefore
    // `totals`) are cleared right after, so the banner must not rely on
    // recomputing totals from an already-emptied cart.
    setLastSale({ ...result, totalCents: result.transaction?.totalCents ?? totals.grandTotalCents });
    setCartItems([]);
    setIsMobileCartOpen(false);
    // Refresh sync status to show pendingCount update
    posApi.getSyncStatus().then(setSyncStatus).catch(() => {});
  };

  const handleLogout = () => {
    setAuthenticatedUser(null);
    localStorage.removeItem("pos-user");
  };

  if (!authenticatedUser) {
    return (
      <Login
        onSuccess={(user) => {
          setAuthenticatedUser(user);
          localStorage.setItem("pos-user", JSON.stringify(user));
        }}
      />
    );
  }

  return (
    <div className="pos-shell">
      {/* Top Header Bar */}
      <Header
        syncStatus={syncStatus}
        onTriggerSync={handleTriggerSync}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        authenticatedUser={authenticatedUser}
        onLogout={handleLogout}
      />

      {/* Last sale confirmation — plain-language, cashier-facing only.
          Technical sync/receipt detail lives in the Diagnostics drawer. */}
      {lastSale && (
        <div
          role="status"
          style={{
            margin: "10px 16px 0",
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            backgroundColor: lastSale.offline ? "var(--accent-amber-bg)" : "var(--accent-sage-bg)",
            border: `1px solid ${lastSale.offline ? "var(--accent-amber-border)" : "var(--accent-sage-border)"}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 30, height: 30, borderRadius: "var(--radius-pill)", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                backgroundColor: lastSale.offline ? "var(--accent-amber)" : "var(--accent-sage)",
                color: "var(--bg-app)",
              }}
            >
              <IconCheck size={15} />
            </span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                Sale complete · {formatCurrency(lastSale.totalCents ?? 0)}
                {lastSale.changeDueCents ? ` · Change due ${formatCurrency(lastSale.changeDueCents)}` : ""}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-secondary)", marginTop: 1 }}>
                {lastSale.offline
                  ? "Saved on this till — will sync automatically once back online."
                  : "Synced to the server."}
              </div>
            </div>
          </div>
          <button
            onClick={() => setLastSale(null)}
            style={{ background: "none", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-pill)", padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="pos-main-container">
        {/* Left Pane: Catalog & Search */}
        <main className="pos-catalog-pane">
          <ProductCatalog
            products={products}
            categories={categories}
            cartQuantityByProductId={cartQuantityByProductId}
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
            className="pos-btn-pill pos-btn-pill-primary"
          >
            <span>Review Cart</span>
            <IconArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Settings Panel — display scale/zoom, density, theme */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Slide-Over Diagnostics Drawer (technical sync/telemetry detail) */}
      <SyncDrawer
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
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
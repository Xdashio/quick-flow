import type { CachedCategory, CachedProduct, CachedTaxCategory, SyncStatus } from "./types";

declare global {
  interface Window {
    posApi?: {
      searchProducts: (query: string, categoryId?: string) => Promise<CachedProduct[]>;
      getProductByBarcode: (barcode: string) => Promise<CachedProduct | null>;
      getAllProducts: () => Promise<CachedProduct[]>;
      getTaxCategories: () => Promise<CachedTaxCategory[]>;
      getCategories: () => Promise<CachedCategory[]>;
      getSyncStatus: () => Promise<SyncStatus>;
      triggerSync: () => Promise<SyncStatus>;
      checkConnectivity: () => Promise<boolean>;
      notifyOnline: () => void;
      onSyncUpdate: (callback: (status: SyncStatus) => void) => () => void;
      completeCashSale: (payload: any) => Promise<any>;
      openDrawer: (args: any) => Promise<any>;
      getPendingCount: () => Promise<number>;
      getLastReceipt: () => Promise<any>;
      previewReceipt: (tx: any) => Promise<any>;
      // Image cache
      getImageLocalPath: (productId: string) => Promise<string | null>;
      cacheImage: (args: { productId: string; imageKey: string; imageUrl: string }) => Promise<{ cached: boolean; localPath?: string; reason?: string }>;
      evictImageCache: (productId: string) => Promise<{ removed: number }>;
    };
  }
}

const isElectron = typeof window !== "undefined" && Boolean(window.posApi);

export const posApi = {
  isElectron,

  async searchProducts(query: string = "", categoryId?: string): Promise<CachedProduct[]> {
    if (window.posApi) {
      return window.posApi.searchProducts(query, categoryId);
    }
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (categoryId) params.set("categoryId", categoryId);
    const res = await fetch(`/api/local-sqlite/products?${params.toString()}`);
    if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);
    return res.json();
  },

  async getProductByBarcode(barcode: string): Promise<CachedProduct | null> {
    if (window.posApi) {
      return window.posApi.getProductByBarcode(barcode);
    }
    const res = await fetch(`/api/local-sqlite/products?barcode=${encodeURIComponent(barcode)}`);
    if (!res.ok) throw new Error(`Barcode lookup failed: ${res.statusText}`);
    return res.json();
  },

  async getAllProducts(): Promise<CachedProduct[]> {
    if (window.posApi) {
      return window.posApi.getAllProducts();
    }
    const res = await fetch("/api/local-sqlite/products");
    if (!res.ok) throw new Error(`Get products failed: ${res.statusText}`);
    return res.json();
  },

  async getTaxCategories(): Promise<CachedTaxCategory[]> {
    if (window.posApi) {
      return window.posApi.getTaxCategories();
    }
    const res = await fetch("/api/local-sqlite/tax-categories");
    if (!res.ok) throw new Error(`Get tax categories failed: ${res.statusText}`);
    return res.json();
  },

  async getCategories(): Promise<CachedCategory[]> {
    if (window.posApi) {
      return window.posApi.getCategories();
    }
    const res = await fetch("/api/local-sqlite/categories");
    if (!res.ok) throw new Error(`Get categories failed: ${res.statusText}`);
    return res.json();
  },

  async getSyncStatus(): Promise<SyncStatus> {
    if (window.posApi) {
      return window.posApi.getSyncStatus();
    }
    const res = await fetch("/api/local-sqlite/sync-status");
    if (!res.ok) throw new Error(`Get sync status failed: ${res.statusText}`);
    return res.json();
  },

  async triggerSync(): Promise<SyncStatus> {
    if (window.posApi) {
      return window.posApi.triggerSync();
    }
    const res = await fetch("/api/local-sqlite/sync-trigger", { method: "POST" });
    if (!res.ok) throw new Error(`Trigger sync failed: ${res.statusText}`);
    return res.json();
  },

  onSyncUpdate(callback: (status: SyncStatus) => void): () => void {
    if (window.posApi) {
      return window.posApi.onSyncUpdate(callback);
    }
    // Poll sync status every 5 seconds in browser dev
    const timer = setInterval(async () => {
      try {
        const status = await this.getSyncStatus();
        callback(status);
      } catch {
        // ignore dev polling error
      }
    }, 5000);
    return () => clearInterval(timer);
  },

  async completeCashSale(payload: any): Promise<any> {
    if (window.posApi?.completeCashSale) return window.posApi.completeCashSale(payload);
    const apiUrl = (import.meta as any).env?.VITE_API_URL || "http://localhost:3000/api";
    const res = await fetch(`${apiUrl}/checkout/cash`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Checkout cash failed ${res.status}: ${await res.text()}`);
    return res.json();
  },

  async openDrawer(args: { reason: string; amountCents?: number; registerId?: string; userId?: string }): Promise<any> {
    if (window.posApi?.openDrawer) return window.posApi.openDrawer(args);
    const apiUrl = (import.meta as any).env?.VITE_API_URL || "http://localhost:3000/api";
    const res = await fetch(`${apiUrl}/checkout/drawer/open`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
    if (!res.ok) throw new Error(`Drawer open failed ${res.status}: ${await res.text()}`);
    return res.json();
  },

  async getPendingCount(): Promise<number> {
    if (window.posApi?.getPendingCount) return window.posApi.getPendingCount();
    return 0;
  },

  async checkConnectivity(): Promise<boolean> {
    if (window.posApi?.checkConnectivity) return window.posApi.checkConnectivity();
    try {
      const apiUrl = (import.meta as any).env?.VITE_API_URL || "http://localhost:3000/api";
      const res = await fetch(`${apiUrl.replace(/\/api\/?$/, "")}/health`, { signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch {
      return false;
    }
  },

  notifyOnline(): void {
    if (window.posApi?.notifyOnline) {
      window.posApi.notifyOnline();
    }
  },

  /**
   * Returns the local file:// path for a cached product image, or null.
   * In browser dev mode always returns null (no local disk).
   */
  async getImageLocalPath(productId: string): Promise<string | null> {
    if (window.posApi?.getImageLocalPath) {
      return window.posApi.getImageLocalPath(productId);
    }
    return null;
  },

  /**
   * Trigger an immediate image download for a single product.
   * Used in the UI to warm the cache after a manual sync.
   */
  async cacheImage(args: { productId: string; imageKey: string; imageUrl: string }) {
    if (window.posApi?.cacheImage) {
      return window.posApi.cacheImage(args);
    }
    return { cached: false, reason: "not in electron" };
  },
};
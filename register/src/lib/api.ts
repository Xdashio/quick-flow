import type { CachedProduct, CachedTaxCategory, SyncStatus } from "./types";

declare global {
  interface Window {
    posApi?: {
      searchProducts: (query: string, categoryId?: string) => Promise<CachedProduct[]>;
      getProductByBarcode: (barcode: string) => Promise<CachedProduct | null>;
      getAllProducts: () => Promise<CachedProduct[]>;
      getTaxCategories: () => Promise<CachedTaxCategory[]>;
      getSyncStatus: () => Promise<SyncStatus>;
      triggerSync: () => Promise<SyncStatus>;
      onSyncUpdate: (callback: (status: SyncStatus) => void) => () => void;
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
};

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
      // Backend URL config
      getBackendUrl: () => Promise<string | null>;
      setBackendUrl: (url: string | null) => Promise<string | null>;
    };
  }
}

const isElectron = typeof window !== "undefined" && Boolean(window.posApi);

// ─── Backend URL resolution with failover ────────────────────────────────────
// This till can reach several backends, in priority order (mirrors
// electron/backend-config.cjs on the main-process side):
//   1. Technician-configured URL for this machine (Electron config IPC)
//   2. Env overrides (VITE_API_URL / POS_API_URL)
//   3. Deployed cloud backend
//   4. localhost:3000 (backend running on this same machine)
//   5. Legacy railway deploy
// A backend only counts as "reachable" if it answers with JSON — hosting
// platforms serve an HTML interstitial with HTTP 200 when the app is down or
// sleeping, which used to surface at login as the cryptic
// `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`.

const CLOUD_API_URL = "https://api.crestcyber.co.ke/api";

function normalizeApiUrl(u: string): string {
  return u.trim().replace(/\/+$/, "");
}

// The backend that last answered correctly. Tried first on the next call.
let activeApiUrl: string | null = null;

export function getApiUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.POS_API_URL;
  if (envUrl) return normalizeApiUrl(envUrl);
  return activeApiUrl || CLOUD_API_URL;
}

export async function getApiUrlCandidates(): Promise<string[]> {
  const urls: (string | null | undefined)[] = [];
  if (window.posApi?.getBackendUrl) {
    try {
      urls.push(await window.posApi.getBackendUrl());
    } catch {
      // config IPC unavailable — fall through to defaults
    }
  }
  urls.push(
    (import.meta as any).env?.VITE_API_URL,
    (import.meta as any).env?.POS_API_URL,
    CLOUD_API_URL,
    "http://localhost:3000/api",
    "https://quickflow-backend.up.railway.app/api",
  );

  const seen = new Set<string>();
  const ordered: string[] = [];
  if (activeApiUrl) {
    seen.add(activeApiUrl);
    ordered.push(activeApiUrl);
  }
  for (const u of urls) {
    if (!u) continue;
    const n = normalizeApiUrl(u);
    if (seen.has(n)) continue;
    seen.add(n);
    ordered.push(n);
  }
  return ordered;
}

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
  /** Prepended to server error messages, e.g. "M-Pesa STK failed". */
  errorPrefix?: string;
}

/**
 * fetch() against the backend failover chain.
 * - Network errors, timeouts and non-JSON 200s (HTML interstitials) move on
 *   to the next candidate backend; the winner is remembered.
 * - Real API errors (4xx) are thrown immediately with the server's message —
 *   the backend was reached and refused, failing over wouldn't help.
 * - 5xx may be a half-dead deploy, so those do fail over.
 */
export async function apiFetch(path: string, init: ApiFetchOptions = {}): Promise<Response> {
  const { timeoutMs = 8000, errorPrefix, ...fetchInit } = init;
  const candidates = await getApiUrlCandidates();
  const unreachable: string[] = [];

  for (const base of candidates) {
    let res: Response;
    try {
      res = await fetch(`${base}${path}`, {
        ...fetchInit,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (e: any) {
      unreachable.push(`${base}: ${e.message}`);
      continue;
    }

    const contentType = res.headers.get("content-type") || "";
    const isJsonApi = contentType.includes("application/json");

    if (res.ok) {
      if (!isJsonApi) {
        // HTML interstitial from the hosting platform — the app behind it is
        // down or sleeping. Not a usable backend right now.
        unreachable.push(`${base}: served ${contentType || "non-JSON"} instead of JSON`);
        continue;
      }
      activeApiUrl = base;
      return res;
    }

    // A JSON error body still proves this backend is alive and is the API —
    // remember it so subsequent calls don't re-probe dead candidates first.
    if (isJsonApi) activeApiUrl = base;

    const bodyText = await res.text().catch(() => "");
    let message = `HTTP ${res.status}`;
    try {
      message = JSON.parse(bodyText).message || message;
    } catch {
      if (bodyText && !bodyText.startsWith("<")) message = bodyText.slice(0, 200);
    }
    if (errorPrefix && !message.startsWith(errorPrefix)) {
      message = `${errorPrefix}: ${message}`;
    }
    if (res.status >= 500) {
      unreachable.push(`${base}: ${message}`);
      continue;
    }
    const err = new Error(message);
    (err as any).statusCode = res.status;
    throw err;
  }

  throw new Error(
    `No reachable backend. Check the till's backend setting or network. (${unreachable.join("; ")})`,
  );
}

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

  async login(username: string, password: string): Promise<{ accessToken: string; user: { id: string; name: string; role: string } }> {
    const res = await apiFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      errorPrefix: "Login failed",
    });
    return res.json();
  },

  async completeCashSale(payload: any): Promise<any> {
    if (window.posApi?.completeCashSale) return window.posApi.completeCashSale(payload);
    const res = await apiFetch("/checkout/cash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      errorPrefix: "Checkout cash failed",
    });
    return res.json();
  },

  async initiateMpesaStkSale(payload: any): Promise<any> {
    const res = await apiFetch("/checkout/mpesa-stk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      errorPrefix: "M-Pesa STK failed",
    });
    return res.json();
  },

  async completeMpesaTillSale(payload: any): Promise<any> {
    const res = await apiFetch("/checkout/mpesa-till", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      errorPrefix: "M-Pesa Till failed",
    });
    return res.json();
  },

  async getPaymentStatus(paymentId: string): Promise<any> {
    const res = await apiFetch(`/payments/status/${paymentId}`, {
      errorPrefix: "Failed to get payment status",
    });
    return res.json();
  },

  async completeMpesaStkSale(paymentId: string): Promise<any> {
    const res = await apiFetch(`/checkout/mpesa-complete/${paymentId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      errorPrefix: "Failed to complete STK receipt",
    });
    return res.json();
  },

  async openDrawer(args: { reason: string; amountCents?: number; registerId?: string; userId?: string }): Promise<any> {
    if (window.posApi?.openDrawer) return window.posApi.openDrawer(args);
    const res = await apiFetch("/checkout/drawer/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
      errorPrefix: "Drawer open failed",
    });
    return res.json();
  },

  async getPendingCount(): Promise<number> {
    if (window.posApi?.getPendingCount) return window.posApi.getPendingCount();
    return 0;
  },

  async checkConnectivity(): Promise<boolean> {
    if (window.posApi?.checkConnectivity) return window.posApi.checkConnectivity();
    try {
      // apiFetch already fails over across candidates and only accepts JSON
      // responses, so an HTML interstitial won't read as "online".
      const res = await apiFetch("/health", { timeoutMs: 3000 });
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

  /**
   * The backend URL a technician has configured for this till (Electron only).
   * Returns null in browser dev mode — there's no persisted per-machine config there.
   */
  async getBackendUrl(): Promise<string | null> {
    if (window.posApi?.getBackendUrl) {
      return window.posApi.getBackendUrl();
    }
    return null;
  },

  /**
   * Point this till at a specific backend (e.g. the shop's local server on
   * the LAN). Takes effect immediately, no restart needed. Electron only.
   */
  async setBackendUrl(url: string | null): Promise<string | null> {
    // Forget the previously winning backend so the new configuration is
    // re-resolved and probed on the very next request.
    activeApiUrl = null;
    if (window.posApi?.setBackendUrl) {
      return window.posApi.setBackendUrl(url);
    }
    return null;
  },
};
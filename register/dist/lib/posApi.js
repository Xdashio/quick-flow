function isElectron() {
    return typeof window !== "undefined" && !!window.posAPI;
}
async function fetchJson(url) {
    const r = await fetch(url);
    if (!r.ok)
        throw new Error(`${url} ${r.status} ${await r.text()}`);
    return r.json();
}
export async function searchProducts(query) {
    if (isElectron())
        return window.posAPI.searchProducts(query);
    // Dev fallback - same SQLite via vite middleware
    const params = new URLSearchParams({ q: query || "" });
    return fetchJson(`/__pos/search?${params.toString()}`);
}
export async function getProductByBarcode(barcode) {
    if (isElectron())
        return window.posAPI.getProductByBarcode(barcode);
    // Dev fallback: search exact barcode via search endpoint
    const rows = await searchProducts(barcode);
    return rows.find((r) => r.barcode === barcode) || null;
}
export async function getAllProducts() {
    if (isElectron())
        return window.posAPI.getAllProducts();
    return fetchJson(`/__pos/all-products`);
}
export async function getTaxCategories() {
    if (isElectron())
        return window.posAPI.getTaxCategories();
    return fetchJson(`/__pos/tax-categories`);
}
export async function syncCatalog() {
    if (isElectron())
        return window.posAPI.syncCatalog();
    // Dev fallback: call standalone sync via backend+sqlite directly? For browser dev, we can call a dev endpoint if exists, else fetch backend and warn.
    // Try to hit Vite dev's sync helper if exposed, otherwise simulate by fetching backend then telling user to run node script
    try {
        // Attempt to call backend directly and indicate sync would happen via Node script
        const res = await fetch(`http://localhost:3000/api/products`);
        if (!res.ok)
            throw new Error(`backend ${res.status}`);
        // In dev fallback we don't write to SQLite via browser - instruct to run script
        // But we can try POST to a dev-only sync endpoint if we add it later
        return { ok: false, error: "Dev browser: run 'node scripts/sync-catalog.mjs' to sync SQLite (Electron syncs automatically)" };
    }
    catch (e) {
        return { ok: false, error: e.message };
    }
}
export async function getSyncStatus() {
    if (isElectron())
        return window.posAPI.getSyncStatus();
    try {
        return await fetchJson(`/__pos/sync-status`);
    }
    catch (e) {
        return { lastSync: null, error: e.message, productCount: 0 };
    }
}
export async function getDbInfo() {
    if (isElectron())
        return window.posAPI.getDbInfo();
    try {
        return await fetchJson(`/__pos/sync-status`);
    }
    catch {
        return null;
    }
}

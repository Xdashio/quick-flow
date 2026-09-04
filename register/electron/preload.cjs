// Preload script: Exposes secure IPC bridge for local SQLite queries and Sync + Checkout
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("posApi", {
  // SQLite Local Cache Queries
  searchProducts: (query, categoryId) =>
    ipcRenderer.invoke("db:search-products", { query, categoryId }),
  getProductByBarcode: (barcode) =>
    ipcRenderer.invoke("db:get-product-by-barcode", barcode),
  getAllProducts: () =>
    ipcRenderer.invoke("db:get-all-products"),
  getTaxCategories: () =>
    ipcRenderer.invoke("db:get-tax-categories"),

  // Sync Operations
  getSyncStatus: () =>
    ipcRenderer.invoke("sync:get-status"),
  triggerSync: () =>
    ipcRenderer.invoke("sync:trigger"),
  checkConnectivity: () =>
    ipcRenderer.invoke("sync:check-connectivity"),
  notifyOnline: () =>
    ipcRenderer.send("sync:network-online"),
  onSyncUpdate: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("sync:update", handler);
    return () => ipcRenderer.removeListener("sync:update", handler);
  },

  // Phase 4: Cash Checkout — offline-capable
  completeCashSale: (payload) =>
    ipcRenderer.invoke("checkout:cash", payload),
  openDrawer: (args) =>
    ipcRenderer.invoke("drawer:open", args),
  getPendingCount: () =>
    ipcRenderer.invoke("checkout:pending-count"),
  getLastReceipt: () =>
    ipcRenderer.invoke("printer:last-receipt"),
  previewReceipt: (tx) =>
    ipcRenderer.invoke("printer:preview", tx),
});

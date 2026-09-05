// electron/paths.cjs — single source of truth for ALL writable runtime paths.
//
// RULE: every mutable file (SQLite DB, image cache, virtual-printer output,
// pos-config.json) MUST live under Electron's per-user `userData` directory.
//
// Why (two real production failures this prevents):
//  1. A packaged Linux AppImage mounts as a READ-ONLY filesystem at runtime —
//     any write relative to __dirname (the app bundle) fails outright.
//  2. Installer updates (Win NSIS / Linux deb) replace the entire install
//     directory — data stored there would be silently WIPED on every update,
//     destroying offline sales history for a POS.
//
// userData (~/.config/QuickFlow Register on Linux,
// %APPDATA%/QuickFlow Register on Win, ~/Library/Application Support on macOS)
// is always writable and survives app updates on every platform.
//
// Dev/test fallback: when running outside Electron (plain `node` for unit
// tests, ad-hoc scripts) there is no `app.getPath` — fall back to the
// repo-local `register/data/` folder, which is writable on a dev machine.
// NOTE: vite-plugin-pos-db.ts and scripts/*.mjs intentionally keep using
// `register/data/` directly — they only ever run unpackaged on a dev box.

const path = require("path");

function getDataDir() {
  // Running inside the Electron main process: use the real per-user dir.
  try {
    // In plain node, require("electron") returns a STRING (path to the
    // binary), not the API — guard against that.
    const electron = require("electron");
    const electronApp = electron && electron.app;
    if (electronApp && typeof electronApp.getPath === "function") {
      try {
        return electronApp.getPath("userData");
      } catch {
        // getPath throws if called before app is ready in some versions —
        // caller (main.cjs) only calls us after whenReady(), so this is just
        // a safety net that falls through to the dev fallback below.
      }
    }
  } catch {
    /* not running under Electron — use dev fallback */
  }
  return path.resolve(__dirname, "../data");
}

function getDbPath() {
  return path.join(getDataDir(), "pos.db");
}

function getImagesDir() {
  return path.join(getDataDir(), "images");
}

function getVirtualPrinterDir() {
  return path.join(getDataDir(), "virtual-printer");
}

module.exports = { getDataDir, getDbPath, getImagesDir, getVirtualPrinterDir };

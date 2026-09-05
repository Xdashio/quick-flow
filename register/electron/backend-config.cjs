// backend-config.cjs
//
// Resolves which backend URL(s) this till should try, and in what order.
//
// Why this exists: a hardcoded "http://localhost:3000/api" only ever makes
// sense when the backend runs on the SAME machine as the till. In a real
// shop, the backend usually runs on one machine (a small server, or the
// owner's PC) and the register runs on separate till machines on the same
// LAN — "localhost" on those tills can never reach it.
//
// This lets a technician set the real backend address once, per machine,
// via a small settings UI (see SyncDrawer) or by hand-editing the config
// file below — no rebuilding or env vars required.
const fs = require("fs");
const path = require("path");

function getConfigPath(app) {
  return path.join(app.getPath("userData"), "pos-config.json");
}

function readConfig(app) {
  const configPath = getConfigPath(app);
  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeConfig(app, config) {
  const configPath = getConfigPath(app);
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
}

function getBackendUrl(app) {
  return readConfig(app).backendUrl || null;
}

function setBackendUrl(app, backendUrl) {
  const config = readConfig(app);
  config.backendUrl = backendUrl ? backendUrl.trim().replace(/\/+$/, "") : null;
  writeConfig(app, config);
  return config.backendUrl;
}

/**
 * Full ordered fallback chain for this machine:
 *  1. User/technician-configured backend URL (persisted, survives restarts)
 *  2. POS_API_URL env var (useful for dev/testing, e.g. one-off overrides)
 *  3. localhost:3000 — only correct when backend runs on this same machine
 *  4. The deployed cloud backend, as a last resort so a till never goes
 *     fully dark just because its local network backend is misconfigured
 */
function resolveApiUrls(app) {
  const configured = getBackendUrl(app);
  return [
    configured,
    process.env.POS_API_URL,
    "http://localhost:3000/api",
    "https://quickflow-backend.up.railway.app/api",
  ].filter(Boolean);
}

module.exports = { getConfigPath, getBackendUrl, setBackendUrl, resolveApiUrls };

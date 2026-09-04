import { useEffect, useState } from "react";

export default function App() {
  const [dbStatus, setDbStatus] = useState<string>("checking...");
  const [syncStatus, setSyncStatus] = useState<string>("idle");

  useEffect(() => {
    // In Electron, this would check SQLite file via IPC. In browser dev, just show placeholder.
    // Real SQLite check happens in electron/main.cjs on startup.
    setDbStatus("local SQLite: data/pos.db (offline-first cache)");
    setSyncStatus("sync agent: queued until online");
  }, []);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <header style={{ borderBottom: "2px solid #111", paddingBottom: 12, marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>POS Register — Phase 0</h1>
        <p style={{ margin: "4px 0 0", color: "#555" }}>
          Electron + React 19 + Vite 8 — plain SPA (not Next.js) · Offline-first · SQLite cache
        </p>
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "#888" }}>
          {dbStatus} · {syncStatus}
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Cart</h2>
          <div
            style={{
              border: "2px dashed #ccc",
              borderRadius: 8,
              padding: 32,
              textAlign: "center",
              color: "#888",
            }}
          >
            Scan-first input auto-focused — barcode → product lookup (local SQLite)
            <br />
            <input
              autoFocus
              placeholder="Scan barcode or type SKU..."
              style={{
                marginTop: 12,
                width: "100%",
                padding: "10px 12px",
                fontSize: 16,
                border: "1px solid #ccc",
                borderRadius: 6,
              }}
            />
            <p style={{ fontSize: 12, marginTop: 8 }}>Phase 0: catalog sync + checkout wired in Phase 2</p>
          </div>
          <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 18 }}>
            <span>Running total</span>
            <span>KES 0.00</span>
          </div>
        </section>

        <aside style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Payment</h3>
          <button style={btnPrimary} disabled>
            Cash (drawer + receipt)
          </button>
          <button style={btnSecondary} disabled>
            M-Pesa STK Push
          </button>
          <button style={btnSecondary} disabled>
            M-Pesa Till (manual)
          </button>
          <p style={{ fontSize: 11, color: "#888", marginTop: 8 }}>Enabled Phase 4 / Phase 7</p>

          <h3>Sync</h3>
          <div style={{ fontSize: 12, background: "#f6f6f6", padding: 8, borderRadius: 6 }}>
            Pending sync: 0<br />
            Last sync: —<br />
            Mode: local-first
          </div>
        </aside>
      </div>

      <footer style={{ marginTop: 24, fontSize: 11, color: "#999", textAlign: "center" }}>
        Shared types: @pos/shared · Backend: NestJS 12 + Prisma 7.10 · Dashboard: Next.js 16
      </footer>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  marginTop: 8,
  background: "#111",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontWeight: 700,
  cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  marginTop: 8,
  background: "#fff",
  color: "#111",
  border: "1px solid #ccc",
  borderRadius: 6,
  fontWeight: 600,
  cursor: "pointer",
};

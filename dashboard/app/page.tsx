async function getHealth() {
  try {
    const res = await fetch("http://localhost:3000/api/health", { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const health = await getHealth();

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <header style={{ borderBottom: "2px solid #111", paddingBottom: 12, marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Manager Dashboard — Phase 0</h1>
        <p style={{ color: "#555", margin: "4px 0 0" }}>
          Next.js 16 App Router + React 19 · Server Components · Real backend aggregation (Phase 9)
        </p>
        <p style={{ fontSize: 12, color: health ? "#0a0" : "#a00" }}>
          Backend: {health ? `ok @ ${health.timestamp}` : "offline — start backend on :3000"}
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <Card title="Sales Today" value="KES 0.00" sub="live aggregation in Phase 9" />
        <Card title="VAT Collected" value="KES 0.00" sub="16% standard / zero / exempt" />
        <Card title="M-Pesa Pending" value="0" sub="awaiting_confirmation flag" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <Card title="Payment Mix" value="cash / mpesa_stk / mpesa_till" sub="Phase 4 + 7" />
        <Card title="Drawer Events" value="0" sub="reason-coded: sale / no_sale / override" />
      </div>

      <div style={{ marginTop: 24, border: "1px solid #ddd", borderRadius: 8, padding: 16, background: "#fff" }}>
        <h3 style={{ marginTop: 0 }}>Inventory</h3>
        <p style={{ color: "#888", fontSize: 14 }}>Inventory ledger (append-only) + current stock view — Phase 9 / Phase 1 backend</p>
        <div style={{ height: 80, background: "#f6f6f6", borderRadius: 6, display: "grid", placeItems: "center", color: "#999" }}>
          Table placeholder — reads real inventory_movements
        </div>
      </div>

      <footer style={{ marginTop: 24, textAlign: "center", fontSize: 11, color: "#999" }}>
        Shared types @pos/shared · Backend NestJS 12 · Register Electron 44 Vite 8 · Dashboard Next 16
      </footer>
    </main>
  );
}

function Card({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, background: "#fff" }}>
      <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 0.5 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
export default function App() {
    const [dbStatus, setDbStatus] = useState("checking...");
    const [syncStatus, setSyncStatus] = useState("idle");
    useEffect(() => {
        // In Electron, this would check SQLite file via IPC. In browser dev, just show placeholder.
        // Real SQLite check happens in electron/main.cjs on startup.
        setDbStatus("local SQLite: data/pos.db (offline-first cache)");
        setSyncStatus("sync agent: queued until online");
    }, []);
    return (_jsxs("div", { style: { fontFamily: "system-ui, sans-serif", padding: 24, maxWidth: 900, margin: "0 auto" }, children: [_jsxs("header", { style: { borderBottom: "2px solid #111", paddingBottom: 12, marginBottom: 24 }, children: [_jsx("h1", { style: { margin: 0, fontSize: 28 }, children: "POS Register \u2014 Phase 0" }), _jsx("p", { style: { margin: "4px 0 0", color: "#555" }, children: "Electron + React 19 + Vite 8 \u2014 plain SPA (not Next.js) \u00B7 Offline-first \u00B7 SQLite cache" }), _jsxs("p", { style: { margin: "8px 0 0", fontSize: 12, color: "#888" }, children: [dbStatus, " \u00B7 ", syncStatus] })] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }, children: [_jsxs("section", { style: { border: "1px solid #ddd", borderRadius: 8, padding: 16 }, children: [_jsx("h2", { style: { marginTop: 0 }, children: "Cart" }), _jsxs("div", { style: {
                                    border: "2px dashed #ccc",
                                    borderRadius: 8,
                                    padding: 32,
                                    textAlign: "center",
                                    color: "#888",
                                }, children: ["Scan-first input auto-focused \u2014 barcode \u2192 product lookup (local SQLite)", _jsx("br", {}), _jsx("input", { autoFocus: true, placeholder: "Scan barcode or type SKU...", style: {
                                            marginTop: 12,
                                            width: "100%",
                                            padding: "10px 12px",
                                            fontSize: 16,
                                            border: "1px solid #ccc",
                                            borderRadius: 6,
                                        } }), _jsx("p", { style: { fontSize: 12, marginTop: 8 }, children: "Phase 0: catalog sync + checkout wired in Phase 2" })] }), _jsxs("div", { style: { marginTop: 16, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 18 }, children: [_jsx("span", { children: "Running total" }), _jsx("span", { children: "KES 0.00" })] })] }), _jsxs("aside", { style: { border: "1px solid #ddd", borderRadius: 8, padding: 16 }, children: [_jsx("h3", { style: { marginTop: 0 }, children: "Payment" }), _jsx("button", { style: btnPrimary, disabled: true, children: "Cash (drawer + receipt)" }), _jsx("button", { style: btnSecondary, disabled: true, children: "M-Pesa STK Push" }), _jsx("button", { style: btnSecondary, disabled: true, children: "M-Pesa Till (manual)" }), _jsx("p", { style: { fontSize: 11, color: "#888", marginTop: 8 }, children: "Enabled Phase 4 / Phase 7" }), _jsx("h3", { children: "Sync" }), _jsxs("div", { style: { fontSize: 12, background: "#f6f6f6", padding: 8, borderRadius: 6 }, children: ["Pending sync: 0", _jsx("br", {}), "Last sync: \u2014", _jsx("br", {}), "Mode: local-first"] })] })] }), _jsx("footer", { style: { marginTop: 24, fontSize: 11, color: "#999", textAlign: "center" }, children: "Shared types: @pos/shared \u00B7 Backend: NestJS 12 + Prisma 7.10 \u00B7 Dashboard: Next.js 16" })] }));
}
const btnPrimary = {
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
const btnSecondary = {
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

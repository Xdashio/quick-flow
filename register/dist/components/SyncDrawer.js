import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { IconClose, IconSync, IconInfo } from "./icons";
import { posApi } from "../lib/api";
export const SyncDrawer = ({ isOpen, onClose, syncStatus, onTriggerSync, }) => {
    const [backendUrlInput, setBackendUrlInput] = useState("");
    const [savedBackendUrl, setSavedBackendUrl] = useState(null);
    const [saveState, setSaveState] = useState("idle");
    useEffect(() => {
        if (!isOpen)
            return;
        posApi.getBackendUrl().then((url) => {
            setSavedBackendUrl(url);
            setBackendUrlInput(url || "");
        });
    }, [isOpen]);
    if (!isOpen)
        return null;
    const isSyncing = syncStatus?.status === "syncing";
    const isOnline = syncStatus?.isOnline ?? true;
    const handleSaveBackendUrl = async () => {
        setSaveState("saving");
        const saved = await posApi.setBackendUrl(backendUrlInput.trim() || null);
        setSavedBackendUrl(saved);
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 1500);
    };
    const handleResetBackendUrl = async () => {
        setSaveState("saving");
        const saved = await posApi.setBackendUrl(null);
        setSavedBackendUrl(saved);
        setBackendUrlInput("");
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 1500);
    };
    return (_jsx("div", { className: "pos-panel-overlay", onClick: onClose, children: _jsxs("div", { className: "pos-panel", onClick: (e) => e.stopPropagation(), role: "dialog", "aria-label": "Sync diagnostics", children: [_jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [_jsxs("div", { children: [_jsx("h3", { style: { fontSize: 15, fontWeight: 700 }, children: "Diagnostics" }), _jsx("p", { style: { fontSize: 11, color: "var(--text-muted)", marginTop: 2 }, children: "SQLite cache & sync telemetry \u2014 for troubleshooting" })] }), _jsx("button", { onClick: onClose, className: "pos-icon-btn", title: "Close", "aria-label": "Close diagnostics", children: _jsx(IconClose, { size: 18 }) })] }), _jsxs("div", { style: {
                        padding: 14,
                        borderRadius: "var(--radius-md)",
                        backgroundColor: "var(--bg-surface-elevated)",
                        border: "1px solid var(--border-subtle)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                    }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx("span", { style: { fontSize: 12, color: "var(--text-secondary)" }, children: "Network Connectivity" }), _jsx("span", { style: {
                                        fontSize: 10.5,
                                        fontWeight: 700,
                                        padding: "2px 8px",
                                        borderRadius: "var(--radius-pill)",
                                        backgroundColor: isOnline ? "var(--accent-emerald-bg)" : "var(--accent-rose-bg)",
                                        color: isOnline ? "var(--accent-emerald)" : "var(--accent-rose)",
                                        letterSpacing: "0.03em",
                                    }, children: isOnline ? "ONLINE" : "OFFLINE" })] }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx("span", { style: { fontSize: 12, color: "var(--text-secondary)" }, children: "Engine State" }), _jsx("span", { style: { fontSize: 12, fontWeight: 600, fontFamily: "var(--font-mono)" }, children: syncStatus?.status?.toUpperCase() || "IDLE" })] }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx("span", { style: { fontSize: 12, color: "var(--text-secondary)" }, children: "Last Sync Finished" }), _jsx("span", { style: { fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }, children: syncStatus?.lastSyncAt ? new Date(syncStatus.lastSyncAt).toLocaleTimeString() : "Never" })] }), syncStatus?.errorMessage && (_jsx("div", { style: {
                                padding: 8,
                                borderRadius: "var(--radius-sm)",
                                backgroundColor: "var(--accent-rose-bg)",
                                color: "var(--accent-rose)",
                                fontSize: 11,
                                fontFamily: "var(--font-mono)",
                                lineHeight: 1.3,
                            }, children: syncStatus.errorMessage }))] }), _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: [_jsx("span", { style: { fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary)" }, children: "Local storage telemetry" }), _jsxs("div", { style: {
                                padding: 12,
                                borderRadius: "var(--radius-md)",
                                backgroundColor: "var(--bg-surface-elevated)",
                                border: "1px solid var(--border-subtle)",
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                                fontSize: 12,
                            }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between" }, children: [_jsx("span", { style: { color: "var(--text-muted)" }, children: "Storage Engine" }), _jsx("span", { style: { fontFamily: "var(--font-mono)" }, children: "SQLite 3 (WAL)" })] }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between" }, children: [_jsx("span", { style: { color: "var(--text-muted)" }, children: "Active Products Cached" }), _jsx("span", { style: { fontFamily: "var(--font-mono)", fontWeight: 700 }, children: syncStatus?.productsCount ?? 0 })] }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between" }, children: [_jsx("span", { style: { color: "var(--text-muted)" }, children: "Tax Categories Cached" }), _jsx("span", { style: { fontFamily: "var(--font-mono)", fontWeight: 700 }, children: syncStatus?.taxCategoriesCount ?? 0 })] }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between" }, children: [_jsx("span", { style: { color: "var(--text-muted)" }, children: "Source API Target" }), _jsx("span", { style: { fontFamily: "var(--font-mono)", color: "var(--accent-blue)" }, children: "/api/products" })] })] })] }), _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: [_jsx("span", { style: { fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary)" }, children: "Backend server" }), _jsxs("div", { style: {
                                padding: 12,
                                borderRadius: "var(--radius-md)",
                                backgroundColor: "var(--bg-surface-elevated)",
                                border: "1px solid var(--border-subtle)",
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                            }, children: [_jsxs("p", { style: { fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4, margin: 0 }, children: ["Point this till at your shop's backend (e.g. ", _jsx("code", { children: "http://192.168.1.50:3000/api" }), "). Leave blank to use automatic detection (local network, then cloud)."] }), _jsx("input", { type: "text", value: backendUrlInput, onChange: (e) => setBackendUrlInput(e.target.value), placeholder: "http://192.168.1.50:3000/api", style: {
                                        fontSize: 12,
                                        fontFamily: "var(--font-mono)",
                                        padding: "8px 10px",
                                        borderRadius: "var(--radius-sm)",
                                        border: "1px solid var(--border-subtle)",
                                        backgroundColor: "var(--bg-surface)",
                                        color: "var(--text-primary)",
                                        outline: "none",
                                    } }), _jsxs("div", { style: { display: "flex", gap: 8 }, children: [_jsx("button", { onClick: handleSaveBackendUrl, disabled: saveState === "saving", style: {
                                                flex: 1,
                                                fontSize: 12,
                                                fontWeight: 600,
                                                padding: "8px 10px",
                                                borderRadius: "var(--radius-sm)",
                                                border: "none",
                                                backgroundColor: "var(--accent-emerald)",
                                                color: "#052e16",
                                                cursor: "pointer",
                                            }, children: saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : "Save" }), _jsx("button", { onClick: handleResetBackendUrl, disabled: saveState === "saving", style: {
                                                fontSize: 12,
                                                fontWeight: 600,
                                                padding: "8px 10px",
                                                borderRadius: "var(--radius-sm)",
                                                border: "1px solid var(--border-subtle)",
                                                backgroundColor: "transparent",
                                                color: "var(--text-secondary)",
                                                cursor: "pointer",
                                            }, children: "Use Automatic" })] }), savedBackendUrl && (_jsxs("span", { style: { fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }, children: ["Currently pinned to: ", savedBackendUrl] }))] })] }), _jsxs("div", { style: {
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        padding: 12,
                        borderRadius: "var(--radius-md)",
                        backgroundColor: "var(--bg-surface-subtle)",
                        border: "1px solid var(--border-subtle)",
                        fontSize: 11.5,
                        color: "var(--text-muted)",
                        lineHeight: 1.45,
                    }, children: [_jsx("span", { style: { marginTop: 2, color: "var(--text-secondary)" }, children: _jsx(IconInfo, { size: 15 }) }), _jsxs("div", { children: [_jsx("strong", { style: { color: "var(--text-secondary)" }, children: "Offline-First Principle:" }), " All product lookups and tax calculations execute against your local SQLite database for sub-millisecond checkout. The background worker syncs changes every 30 seconds automatically."] })] }), _jsx("div", { style: { marginTop: "auto" }, children: _jsxs("button", { onClick: onTriggerSync, disabled: isSyncing, className: "pos-btn-pill pos-btn-pill-primary", style: {
                            width: "100%",
                            height: "var(--touch-min)",
                            opacity: isSyncing ? 0.6 : 1,
                            cursor: isSyncing ? "default" : "pointer",
                        }, children: [_jsx("span", { style: { animation: isSyncing ? "pos-spin 1s linear infinite" : "none" }, children: _jsx(IconSync, { size: 14 }) }), _jsx("span", { children: isSyncing ? "Syncing..." : "Sync Database Now" })] }) })] }) }));
};

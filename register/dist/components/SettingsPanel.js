import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSettings } from "../lib/settings";
import { IconClose, IconSun, IconMoon, IconZoomIn, IconZoomOut, IconCheck } from "./icons";
const DENSITY_OPTIONS = [
    { id: "compact", label: "Compact", hint: "More items on screen" },
    { id: "comfortable", label: "Comfortable", hint: "Balanced (default)" },
    { id: "spacious", label: "Spacious", hint: "Larger tap targets" },
];
export const SettingsPanel = ({ isOpen, onClose }) => {
    const { theme, setTheme, displayScale, setDisplayScale, increaseScale, decreaseScale, resetScale, density, setDensity, scaleBounds, } = useSettings();
    if (!isOpen)
        return null;
    const scalePct = Math.round(displayScale * 100);
    return (_jsx("div", { className: "pos-panel-overlay", onClick: onClose, children: _jsxs("div", { className: "pos-panel", onClick: (e) => e.stopPropagation(), role: "dialog", "aria-label": "Display settings", children: [_jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [_jsxs("div", { children: [_jsx("h3", { style: { fontSize: 16, fontWeight: 700 }, children: "Display Settings" }), _jsx("p", { style: { fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }, children: "Changes apply instantly and are remembered on this till" })] }), _jsx("button", { onClick: onClose, className: "pos-icon-btn", title: "Close settings", "aria-label": "Close settings", children: _jsx(IconClose, { size: 18 }) })] }), _jsxs("section", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: [_jsx("span", { style: { fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary)" }, children: "Appearance" }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }, children: [_jsxs("button", { onClick: () => setTheme("light"), style: {
                                        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                                        padding: "14px 10px", borderRadius: "var(--radius-md)",
                                        backgroundColor: theme === "light" ? "var(--accent-terracotta-bg)" : "var(--bg-surface-elevated)",
                                        border: `1.5px solid ${theme === "light" ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                                        color: theme === "light" ? "var(--accent-primary)" : "var(--text-secondary)",
                                        cursor: "pointer", fontWeight: 700, fontSize: 13,
                                    }, children: [_jsx(IconSun, { size: 20 }), "Light"] }), _jsxs("button", { onClick: () => setTheme("dark"), style: {
                                        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                                        padding: "14px 10px", borderRadius: "var(--radius-md)",
                                        backgroundColor: theme === "dark" ? "var(--accent-terracotta-bg)" : "var(--bg-surface-elevated)",
                                        border: `1.5px solid ${theme === "dark" ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                                        color: theme === "dark" ? "var(--accent-primary)" : "var(--text-secondary)",
                                        cursor: "pointer", fontWeight: 700, fontSize: 13,
                                    }, children: [_jsx(IconMoon, { size: 20 }), "Dark"] })] })] }), _jsxs("section", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: [_jsx("span", { style: { fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary)" }, children: "Text & zoom size" }), _jsxs("div", { style: {
                                display: "flex", alignItems: "center", gap: 10,
                                padding: 12, borderRadius: "var(--radius-md)",
                                backgroundColor: "var(--bg-surface-elevated)", border: "1px solid var(--border-subtle)",
                            }, children: [_jsx("button", { onClick: decreaseScale, disabled: displayScale <= scaleBounds.min, className: "pos-icon-btn", style: { width: 38, height: 38, minHeight: 38, opacity: displayScale <= scaleBounds.min ? 0.4 : 1 }, "aria-label": "Decrease text size", children: _jsx(IconZoomOut, { size: 16 }) }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("input", { type: "range", min: scaleBounds.min, max: scaleBounds.max, step: scaleBounds.step, value: displayScale, onChange: (e) => setDisplayScale(parseFloat(e.target.value)), style: { width: "100%", accentColor: "var(--accent-primary)" }, "aria-label": "Display scale" }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)", marginTop: 2 }, children: [_jsx("span", { children: "Smaller" }), _jsxs("span", { style: { fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }, children: [scalePct, "%"] }), _jsx("span", { children: "Larger" })] })] }), _jsx("button", { onClick: increaseScale, disabled: displayScale >= scaleBounds.max, className: "pos-icon-btn", style: { width: 38, height: 38, minHeight: 38, opacity: displayScale >= scaleBounds.max ? 0.4 : 1 }, "aria-label": "Increase text size", children: _jsx(IconZoomIn, { size: 16 }) })] }), displayScale !== 1 && (_jsx("button", { onClick: resetScale, style: {
                                alignSelf: "flex-start", background: "none", border: "none",
                                color: "var(--accent-primary)", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "2px 0",
                            }, children: "Reset to 100%" })), _jsx("p", { style: { fontSize: 11, color: "var(--text-muted)", lineHeight: 1.45 }, children: "Scales everything on screen \u2014 text, buttons and spacing \u2014 so the register stays easy to read and tap at any distance." })] }), _jsxs("section", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: [_jsx("span", { style: { fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary)" }, children: "Layout density" }), _jsx("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: DENSITY_OPTIONS.map((opt) => {
                                const active = density === opt.id;
                                return (_jsxs("button", { onClick: () => setDensity(opt.id), style: {
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                        padding: "12px 14px", borderRadius: "var(--radius-md)",
                                        backgroundColor: active ? "var(--accent-terracotta-bg)" : "var(--bg-surface-elevated)",
                                        border: `1.5px solid ${active ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                                        cursor: "pointer", textAlign: "left",
                                    }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: 13, fontWeight: 700, color: active ? "var(--accent-primary)" : "var(--text-primary)" }, children: opt.label }), _jsx("div", { style: { fontSize: 11, color: "var(--text-muted)" }, children: opt.hint })] }), active && _jsx(IconCheck, { size: 16 })] }, opt.id));
                            }) })] })] }) }));
};

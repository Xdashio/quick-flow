import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { useSettings } from "../lib/settings";
import { IconSync, IconSun, IconMoon, IconLock, IconSettings, IconMenu, IconClose } from "./icons";
export const Header = ({ syncStatus, onTriggerSync, onOpenDiagnostics, onOpenSettings, authenticatedUser, onLogout, }) => {
    const { theme, toggleTheme } = useSettings();
    const [isOverflowOpen, setIsOverflowOpen] = useState(false);
    // Locking the till is a routine, frequent action (end of shift, stepping
    // away) — not a destructive one — so it shouldn't sit permanently in
    // warning-red like an error state. It stays visually neutral until armed,
    // then asks for a second tap, same inline-confirm pattern used for
    // removing cart items.
    const [logoutArmed, setLogoutArmed] = useState(false);
    const logoutTimerRef = useRef(null);
    useEffect(() => () => { if (logoutTimerRef.current)
        clearTimeout(logoutTimerRef.current); }, []);
    const handleLogoutClick = () => {
        if (logoutArmed) {
            if (logoutTimerRef.current)
                clearTimeout(logoutTimerRef.current);
            setLogoutArmed(false);
            onLogout?.();
        }
        else {
            setLogoutArmed(true);
            logoutTimerRef.current = setTimeout(() => setLogoutArmed(false), 2500);
        }
    };
    const isSyncing = syncStatus?.status === "syncing";
    const isOffline = syncStatus?.status === "offline" || !syncStatus?.isOnline;
    const pendingCount = syncStatus?.pendingCount ?? 0;
    return (_jsxs("header", { style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 64,
            padding: "0 16px",
            backgroundColor: "var(--bg-surface)",
            borderBottom: "1px solid var(--border-subtle)",
            userSelect: "none",
            zIndex: 50,
            position: "relative",
        }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12, minWidth: 0 }, children: [_jsx("div", { style: {
                            width: 32,
                            height: 32,
                            borderRadius: "var(--radius-md)",
                            backgroundColor: "var(--accent-primary)",
                            color: "var(--accent-primary-text)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "var(--font-mono)",
                            fontWeight: 700,
                            fontSize: 12.5,
                            letterSpacing: "-0.02em",
                            flexShrink: 0,
                        }, children: "QF" }), _jsxs("div", { style: { minWidth: 0 }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [_jsx("span", { style: { fontWeight: 700, fontSize: 14.5, letterSpacing: "-0.01em" }, children: "QuickFlow" }), _jsx("span", { style: {
                                            fontSize: 10.5,
                                            fontFamily: "var(--font-mono)",
                                            fontWeight: 600,
                                            padding: "2px 7px",
                                            borderRadius: "var(--radius-sm)",
                                            backgroundColor: "var(--bg-surface-subtle)",
                                            color: "var(--text-muted)",
                                            border: "1px solid var(--border-subtle)",
                                            letterSpacing: "0.02em",
                                        }, children: "REG-01" })] }), _jsx("div", { className: "header-subtitle", style: { fontSize: 11.5, color: "var(--text-muted)" }, children: "Downtown Flagship" })] })] }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [_jsxs("button", { onClick: onOpenDiagnostics, title: "View sync diagnostics", className: "header-connectivity-pill", style: {
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            height: "var(--touch-min)",
                            padding: "0 14px",
                            borderRadius: "var(--radius-pill)",
                            backgroundColor: isOffline
                                ? "var(--accent-amber-bg)"
                                : "var(--accent-sage-bg)",
                            border: `1px solid ${isOffline ? "var(--accent-amber-border)" : "var(--accent-sage-border)"}`,
                            cursor: "pointer",
                            transition: "all 0.18s var(--ease-spring)",
                        }, children: [_jsx("span", { style: {
                                    width: 7,
                                    height: 7,
                                    borderRadius: "50%",
                                    backgroundColor: isOffline ? "var(--accent-amber)" : "var(--accent-sage)",
                                    display: "inline-block",
                                    animation: isSyncing ? "pos-spin 1.2s linear infinite" : "none",
                                } }), _jsx("span", { style: {
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: isOffline ? "var(--accent-amber)" : "var(--accent-sage)",
                                }, children: isSyncing ? "Syncing" : isOffline ? "Working offline" : "Online" }), pendingCount > 0 && (_jsxs("span", { style: {
                                    fontSize: 10.5,
                                    fontWeight: 800,
                                    padding: "1px 7px",
                                    borderRadius: "var(--radius-pill)",
                                    backgroundColor: "var(--accent-amber)",
                                    color: "var(--bg-app)",
                                }, children: [pendingCount, " queued"] }))] }), _jsxs("div", { className: "header-primary-actions", style: { display: "flex", alignItems: "center", gap: 8 }, children: [_jsx("button", { onClick: onTriggerSync, disabled: isSyncing, className: "pos-icon-btn", title: "Sync now", "aria-label": "Sync now", children: _jsx("span", { style: { display: "flex", animation: isSyncing ? "pos-spin 1s linear infinite" : "none" }, children: _jsx(IconSync, { size: 16 }) }) }), _jsx("button", { onClick: onOpenSettings, className: "pos-icon-btn", title: "Display settings", "aria-label": "Display settings", children: _jsx(IconSettings, { size: 16 }) }), _jsx("button", { onClick: toggleTheme, className: "pos-icon-btn", title: `Switch to ${theme === "dark" ? "light" : "dark"} mode`, "aria-label": "Toggle theme", children: theme === "dark" ? _jsx(IconSun, { size: 16 }) : _jsx(IconMoon, { size: 16 }) })] }), authenticatedUser && (_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [_jsxs("div", { className: "header-cashier-name", style: {
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "var(--text-primary)",
                                    backgroundColor: "var(--bg-surface-elevated)",
                                    border: "1px solid var(--border-subtle)",
                                    padding: "0 12px",
                                    height: "var(--touch-min)",
                                    borderRadius: "var(--radius-pill)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                }, children: [_jsx("span", { style: {
                                            width: 6,
                                            height: 6,
                                            borderRadius: "50%",
                                            backgroundColor: "var(--accent-emerald)",
                                            display: "inline-block",
                                        } }), _jsx("span", { children: authenticatedUser.name })] }), onLogout && (_jsxs("button", { onClick: handleLogoutClick, title: logoutArmed ? "Tap again to confirm" : "Lock Till / Sign Out", className: "pos-icon-btn", style: {
                                    gap: logoutArmed ? 6 : 0,
                                    width: logoutArmed ? "auto" : undefined,
                                    padding: logoutArmed ? "0 12px" : undefined,
                                    backgroundColor: logoutArmed ? "var(--accent-rose-bg)" : undefined,
                                    border: logoutArmed ? "1px solid var(--accent-rose-border)" : undefined,
                                    color: logoutArmed ? "var(--accent-rose)" : undefined,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    transition: "all 0.18s var(--ease-spring)",
                                }, children: [_jsx(IconLock, { size: 16 }), logoutArmed && _jsx("span", { children: "Confirm?" })] }))] })), _jsx("button", { onClick: () => setIsOverflowOpen((v) => !v), className: "pos-icon-btn header-overflow-btn", title: "More actions", "aria-label": "More actions", children: isOverflowOpen ? _jsx(IconClose, { size: 16 }) : _jsx(IconMenu, { size: 16 }) })] }), isOverflowOpen && (_jsxs("div", { className: "header-overflow-panel", style: {
                    position: "absolute",
                    top: 64,
                    right: 16,
                    zIndex: 60,
                    backgroundColor: "var(--bg-surface-elevated)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "var(--shadow-elevated)",
                    padding: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    minWidth: 200,
                }, children: [_jsxs("button", { className: "header-overflow-item", onClick: () => { onTriggerSync(); setIsOverflowOpen(false); }, children: [_jsx(IconSync, { size: 15 }), " Sync now"] }), _jsxs("button", { className: "header-overflow-item", onClick: () => { onOpenSettings(); setIsOverflowOpen(false); }, children: [_jsx(IconSettings, { size: 15 }), " Display settings"] }), _jsxs("button", { className: "header-overflow-item", onClick: () => { toggleTheme(); setIsOverflowOpen(false); }, children: [theme === "dark" ? _jsx(IconSun, { size: 15 }) : _jsx(IconMoon, { size: 15 }), theme === "dark" ? "Light mode" : "Dark mode"] })] })), _jsx("style", { children: `
        @media (min-width: 640px) {
          .header-subtitle { display: block !important; }
        }
        .header-subtitle { display: none; }

        .header-overflow-btn { display: none; }
        .header-overflow-item {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 10px; border-radius: var(--radius-sm);
          background: none; border: none; color: var(--text-primary);
          font-size: 13px; font-weight: 600; cursor: pointer; text-align: left;
          min-height: var(--touch-min);
        }
        .header-overflow-item:hover { background-color: var(--bg-surface-subtle); }

        /* Narrow laptops/tablets: fold the icon actions + theme toggle into
           the overflow menu, keep connectivity + cashier lock visible. */
        @media (max-width: 860px) {
          .header-primary-actions { display: none !important; }
          .header-overflow-btn { display: inline-flex !important; }
        }

        @media (max-width: 520px) {
          .header-cashier-name span:last-child { display: none; }
          .header-connectivity-pill span:nth-child(2) { display: none; }
        }
      ` })] }));
};

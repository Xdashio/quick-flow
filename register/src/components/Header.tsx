import React from "react";
import type { SyncStatus } from "../lib/types";
import { IconSync, IconSun, IconMoon, IconLock } from "./icons";

interface HeaderProps {
  syncStatus: SyncStatus | null;
  onTriggerSync: () => void;
  onToggleDrawer: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  authenticatedUser?: { name: string; role: string } | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  syncStatus,
  onTriggerSync,
  onToggleDrawer,
  theme,
  onToggleTheme,
  authenticatedUser,
  onLogout,
}) => {
  const isSyncing = syncStatus?.status === "syncing";
  const isOffline = syncStatus?.status === "offline" || !syncStatus?.isOnline;
  const productsCount = syncStatus?.productsCount ?? 0;

  const formatLastSync = (isoString: string | null | undefined) => {
    if (!isoString) return "Never";
    try {
      const date = new Date(isoString);
      const diffSecs = Math.round((Date.now() - date.getTime()) / 1000);
      if (diffSecs < 10) return "Just now";
      if (diffSecs < 60) return `${diffSecs}s ago`;
      const mins = Math.floor(diffSecs / 60);
      if (mins < 60) return `${mins}m ago`;
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Recently";
    }
  };

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 64,
        padding: "0 20px",
        backgroundColor: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-subtle)",
        userSelect: "none",
        zIndex: 50,
      }}
    >
      {/* Brand & Location Info */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "var(--radius-pill)",
            backgroundColor: "var(--accent-terracotta)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: "-0.03em",
            boxShadow: "0 2px 6px rgba(217, 119, 87, 0.3)",
          }}
        >
          QF
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.02em" }}>
              QuickFlow
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: "var(--radius-pill)",
                backgroundColor: "var(--bg-surface-subtle)",
                color: "var(--text-muted)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              REG-01
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-muted)", display: "none" }} className="header-subtitle">
            Downtown Flagship · Offline SQLite Engine
          </div>
        </div>
      </div>

      {/* Sync Badge, Diagnostics & Theme Switcher */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Unobtrusive SQLite Sync Badge (Pill) */}
        <button
          onClick={onToggleDrawer}
          title="Click to inspect SQLite local cache diagnostics"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: "var(--radius-pill)",
            backgroundColor: isOffline
              ? "var(--accent-rose-bg)"
              : isSyncing
              ? "var(--accent-amber-bg)"
              : "var(--accent-sage-bg)",
            border: `1px solid ${
              isOffline
                ? "rgba(224, 109, 115, 0.3)"
                : isSyncing
                ? "rgba(224, 159, 62, 0.3)"
                : "rgba(141, 161, 115, 0.35)"
            }`,
            cursor: "pointer",
            transition: "all 0.18s var(--ease-spring)",
          }}
        >
          {/* Status Dot */}
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: isOffline
                ? "var(--accent-rose)"
                : isSyncing
                ? "var(--accent-amber)"
                : "var(--accent-sage)",
              display: "inline-block",
            }}
          />

          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: isOffline
                ? "var(--accent-rose)"
                : isSyncing
                ? "var(--accent-amber)"
                : "var(--accent-sage)",
            }}
          >
            {isSyncing
              ? "Syncing..."
              : isOffline
              ? `Offline (${productsCount})`
              : `SQLite (${productsCount})`}
          </span>

          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: "var(--text-muted)",
            }}
          >
            · {formatLastSync(syncStatus?.lastSyncAt)}
          </span>
        </button>

        {/* Sync Now Button (Pill) */}
        <button
          onClick={onTriggerSync}
          disabled={isSyncing}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 15px",
            borderRadius: "var(--radius-pill)",
            backgroundColor: "var(--bg-surface-elevated)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
            fontSize: 12,
            fontWeight: 600,
            cursor: isSyncing ? "default" : "pointer",
            opacity: isSyncing ? 0.6 : 1,
            transition: "all 0.15s ease",
          }}
          title="Trigger immediate sync against backend"
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              animation: isSyncing ? "pos-spin 1s linear infinite" : "none",
            }}
          >
            <IconSync size={13} />
          </span>
          <span>{isSyncing ? "Syncing" : "Sync Now"}</span>
        </button>

        {/* Theme Toggle Button (Circular Pill) */}
        <button
          onClick={onToggleTheme}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: "var(--radius-pill)",
            backgroundColor: "var(--bg-surface-elevated)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          title={`Switch to ${theme === "dark" ? "Ivory Cream Light" : "Warm Obsidian Dark"} mode`}
        >
          {theme === "dark" ? <IconSun size={16} /> : <IconMoon size={16} />}
        </button>

        {/* Cashier Badge & Lock Till Button */}
        {authenticatedUser && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 4 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-primary)",
                backgroundColor: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-subtle)",
                padding: "6px 12px",
                borderRadius: "var(--radius-pill)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "var(--accent-emerald)",
                  display: "inline-block",
                }}
              />
              <span>{authenticatedUser.name}</span>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Lock Till / Sign Out"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: "var(--accent-rose-bg)",
                  border: "1px solid rgba(224, 109, 115, 0.3)",
                  color: "var(--accent-rose)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <IconLock size={12} />
                <span>Lock</span>
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 640px) {
          .header-subtitle { display: block !important; }
        }
      `}</style>
    </header>
  );
};

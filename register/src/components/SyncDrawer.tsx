import React from "react";
import type { SyncStatus } from "../lib/types";
import { IconClose, IconSync, IconInfo } from "./icons";

interface SyncDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  syncStatus: SyncStatus | null;
  onTriggerSync: () => void;
}

export const SyncDrawer: React.FC<SyncDrawerProps> = ({
  isOpen,
  onClose,
  syncStatus,
  onTriggerSync,
}) => {
  if (!isOpen) return null;

  const isSyncing = syncStatus?.status === "syncing";
  const isOnline = syncStatus?.isOnline ?? true;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        display: "flex",
        justifyContent: "flex-end",
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          height: "100%",
          backgroundColor: "var(--bg-surface)",
          borderLeft: "1px solid var(--border-subtle)",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 18,
          boxShadow: "-16px 0 32px rgba(0, 0, 0, 0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>SQLite Cache & Sync</h3>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              Offline data layer telemetry
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
            }}
          >
            <IconClose size={18} />
          </button>
        </div>

        {/* Network & Engine State Card */}
        <div
          style={{
            padding: 14,
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--bg-surface-elevated)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Network Connectivity</span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "var(--radius-pill)",
                backgroundColor: isOnline ? "var(--accent-emerald-bg)" : "var(--accent-rose-bg)",
                color: isOnline ? "var(--accent-emerald)" : "var(--accent-rose)",
                letterSpacing: "0.03em",
              }}
            >
              {isOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Engine State</span>
            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "var(--font-mono)" }}>
              {syncStatus?.status?.toUpperCase() || "IDLE"}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Last Sync Finished</span>
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
              {syncStatus?.lastSyncAt ? new Date(syncStatus.lastSyncAt).toLocaleTimeString() : "Never"}
            </span>
          </div>

          {syncStatus?.errorMessage && (
            <div
              style={{
                padding: 8,
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--accent-rose-bg)",
                color: "var(--accent-rose)",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                lineHeight: 1.3,
              }}
            >
              {syncStatus.errorMessage}
            </div>
          )}
        </div>

        {/* Database Telemetry */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Local Storage Telemetry
          </span>

          <div
            style={{
              padding: 12,
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              fontSize: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Storage Engine</span>
              <span style={{ fontFamily: "var(--font-mono)" }}>SQLite 3 (WAL)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Active Products Cached</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                {syncStatus?.productsCount ?? 0}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Tax Categories Cached</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                {syncStatus?.taxCategoriesCount ?? 0}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Source API Target</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-blue)" }}>
                /api/products
              </span>
            </div>
          </div>
        </div>

        {/* Offline Principle Explanation Card */}
        <div
          style={{
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
          }}
        >
          <span style={{ marginTop: 2, color: "var(--text-secondary)" }}>
            <IconInfo size={15} />
          </span>
          <div>
            <strong style={{ color: "var(--text-secondary)" }}>Offline-First Principle:</strong> All product lookups and tax calculations execute against your local SQLite database for sub-millisecond checkout. The background worker syncs changes every 30 seconds automatically.
          </div>
        </div>

        {/* Sync Trigger Button */}
        <div style={{ marginTop: "auto" }}>
          <button
            onClick={onTriggerSync}
            disabled={isSyncing}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              height: 40,
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--accent-primary)",
              color: "var(--accent-primary-text)",
              border: "none",
              fontSize: 13,
              fontWeight: 700,
              cursor: isSyncing ? "default" : "pointer",
              opacity: isSyncing ? 0.6 : 1,
            }}
          >
            <span style={{ animation: isSyncing ? "pos-spin 1s linear infinite" : "none" }}>
              <IconSync size={14} />
            </span>
            <span>{isSyncing ? "Syncing..." : "Sync Database Now"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

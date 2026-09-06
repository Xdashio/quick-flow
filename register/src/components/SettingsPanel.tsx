import React from "react";
import { useSettings, type Density } from "../lib/settings";
import { IconClose, IconSun, IconMoon, IconZoomIn, IconZoomOut, IconCheck } from "./icons";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const DENSITY_OPTIONS: { id: Density; label: string; hint: string }[] = [
  { id: "compact", label: "Compact", hint: "More items on screen" },
  { id: "comfortable", label: "Comfortable", hint: "Balanced (default)" },
  { id: "spacious", label: "Spacious", hint: "Larger tap targets" },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const {
    theme,
    setTheme,
    displayScale,
    setDisplayScale,
    increaseScale,
    decreaseScale,
    resetScale,
    density,
    setDensity,
    scaleBounds,
  } = useSettings();

  if (!isOpen) return null;

  const scalePct = Math.round(displayScale * 100);

  return (
    <div className="pos-panel-overlay" onClick={onClose}>
      <div className="pos-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Display settings">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Display Settings</h3>
            <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
              Changes apply instantly and are remembered on this till
            </p>
          </div>
          <button onClick={onClose} className="pos-icon-btn" title="Close settings" aria-label="Close settings">
            <IconClose size={18} />
          </button>
        </div>

        {/* Theme */}
        <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Appearance
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button
              onClick={() => setTheme("light")}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                padding: "14px 10px", borderRadius: "var(--radius-md)",
                backgroundColor: theme === "light" ? "var(--accent-terracotta-bg)" : "var(--bg-surface-elevated)",
                border: `1.5px solid ${theme === "light" ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                color: theme === "light" ? "var(--accent-primary)" : "var(--text-secondary)",
                cursor: "pointer", fontWeight: 700, fontSize: 13,
              }}
            >
              <IconSun size={20} />
              Light
            </button>
            <button
              onClick={() => setTheme("dark")}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                padding: "14px 10px", borderRadius: "var(--radius-md)",
                backgroundColor: theme === "dark" ? "var(--accent-terracotta-bg)" : "var(--bg-surface-elevated)",
                border: `1.5px solid ${theme === "dark" ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                color: theme === "dark" ? "var(--accent-primary)" : "var(--text-secondary)",
                cursor: "pointer", fontWeight: 700, fontSize: 13,
              }}
            >
              <IconMoon size={20} />
              Dark
            </button>
          </div>
        </section>

        {/* Display Scale / Zoom / Font size */}
        <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Text &amp; Zoom Size
          </span>
          <div
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: 12, borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-surface-elevated)", border: "1px solid var(--border-subtle)",
            }}
          >
            <button
              onClick={decreaseScale}
              disabled={displayScale <= scaleBounds.min}
              className="pos-icon-btn"
              style={{ width: 38, height: 38, minHeight: 38, opacity: displayScale <= scaleBounds.min ? 0.4 : 1 }}
              aria-label="Decrease text size"
            >
              <IconZoomOut size={16} />
            </button>

            <div style={{ flex: 1 }}>
              <input
                type="range"
                min={scaleBounds.min}
                max={scaleBounds.max}
                step={scaleBounds.step}
                value={displayScale}
                onChange={(e) => setDisplayScale(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "var(--accent-primary)" }}
                aria-label="Display scale"
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                <span>Smaller</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>{scalePct}%</span>
                <span>Larger</span>
              </div>
            </div>

            <button
              onClick={increaseScale}
              disabled={displayScale >= scaleBounds.max}
              className="pos-icon-btn"
              style={{ width: 38, height: 38, minHeight: 38, opacity: displayScale >= scaleBounds.max ? 0.4 : 1 }}
              aria-label="Increase text size"
            >
              <IconZoomIn size={16} />
            </button>
          </div>
          {displayScale !== 1 && (
            <button
              onClick={resetScale}
              style={{
                alignSelf: "flex-start", background: "none", border: "none",
                color: "var(--accent-primary)", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "2px 0",
              }}
            >
              Reset to 100%
            </button>
          )}
          <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.45 }}>
            Scales everything on screen — text, buttons and spacing — so the register stays easy to read and tap at any distance.
          </p>
        </section>

        {/* Density */}
        <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Layout Density
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {DENSITY_OPTIONS.map((opt) => {
              const active = density === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setDensity(opt.id)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 14px", borderRadius: "var(--radius-md)",
                    backgroundColor: active ? "var(--accent-terracotta-bg)" : "var(--bg-surface-elevated)",
                    border: `1.5px solid ${active ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: active ? "var(--accent-primary)" : "var(--text-primary)" }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{opt.hint}</div>
                  </div>
                  {active && <IconCheck size={16} />}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
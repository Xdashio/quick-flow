import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type ThemeMode = "dark" | "light";
export type Density = "compact" | "comfortable" | "spacious";

export interface PosSettings {
  theme: ThemeMode;
  /** 0.9 – 1.6, applied as CSS `zoom` on <html>. 1 = 100%. */
  displayScale: number;
  density: Density;
}

// Default to light: counters sit under bright overhead shop lighting, and a
// lighter surface holds up better against glare/legibility than a near-black
// one for a screen viewed from arm's length by both cashier and customer.
// Dark mode is still one tap away via the header toggle for anyone who
// prefers it or works a dim/late-night counter.
const DEFAULT_SETTINGS: PosSettings = {
  theme: "light",
  displayScale: 1,
  density: "comfortable",
};

const STORAGE_KEY = "pos-settings";
const SCALE_MIN = 0.9;
const SCALE_MAX = 1.6;
const SCALE_STEP = 0.1;

function loadSettings(): PosSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Migrate the old standalone "pos-theme" key if present, so upgrading
      // users don't get bounced back to dark mode.
      const legacyTheme = localStorage.getItem("pos-theme");
      if (legacyTheme === "light" || legacyTheme === "dark") {
        return { ...DEFAULT_SETTINGS, theme: legacyTheme };
      }
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return {
      theme: parsed.theme === "dark" ? "dark" : "light",
      displayScale: clampScale(Number(parsed.displayScale) || 1),
      density: ["compact", "comfortable", "spacious"].includes(parsed.density)
        ? parsed.density
        : "comfortable",
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function clampScale(v: number): number {
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, Math.round(v * 10) / 10));
}

interface SettingsContextValue extends PosSettings {
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setDisplayScale: (scale: number) => void;
  increaseScale: () => void;
  decreaseScale: () => void;
  resetScale: () => void;
  setDensity: (density: Density) => void;
  scaleBounds: { min: number; max: number; step: number };
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<PosSettings>(() => loadSettings());

  // Apply to <html> — theme (color tokens), zoom (display scale), density
  // (spacing tokens) all read these attributes/vars in index.css.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", settings.theme);
    root.setAttribute("data-density", settings.density);
    root.style.setProperty("--display-scale", String(settings.displayScale));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const setTheme = useCallback((theme: ThemeMode) => {
    setSettings((prev) => ({ ...prev, theme }));
  }, []);

  const toggleTheme = useCallback(() => {
    setSettings((prev) => ({ ...prev, theme: prev.theme === "dark" ? "light" : "dark" }));
  }, []);

  const setDisplayScale = useCallback((scale: number) => {
    setSettings((prev) => ({ ...prev, displayScale: clampScale(scale) }));
  }, []);

  const increaseScale = useCallback(() => {
    setSettings((prev) => ({ ...prev, displayScale: clampScale(prev.displayScale + SCALE_STEP) }));
  }, []);

  const decreaseScale = useCallback(() => {
    setSettings((prev) => ({ ...prev, displayScale: clampScale(prev.displayScale - SCALE_STEP) }));
  }, []);

  const resetScale = useCallback(() => {
    setSettings((prev) => ({ ...prev, displayScale: 1 }));
  }, []);

  const setDensity = useCallback((density: Density) => {
    setSettings((prev) => ({ ...prev, density }));
  }, []);

  const value: SettingsContextValue = {
    ...settings,
    setTheme,
    toggleTheme,
    setDisplayScale,
    increaseScale,
    decreaseScale,
    resetScale,
    setDensity,
    scaleBounds: { min: SCALE_MIN, max: SCALE_MAX, step: SCALE_STEP },
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
}
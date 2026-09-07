import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
// Default to light: counters sit under bright overhead shop lighting, and a
// lighter surface holds up better against glare/legibility than a near-black
// one for a screen viewed from arm's length by both cashier and customer.
// Dark mode is still one tap away via the header toggle for anyone who
// prefers it or works a dim/late-night counter.
const DEFAULT_SETTINGS = {
    theme: "light",
    displayScale: 1,
    density: "comfortable",
};
const STORAGE_KEY = "pos-settings";
const SCALE_MIN = 0.9;
const SCALE_MAX = 1.6;
const SCALE_STEP = 0.1;
function loadSettings() {
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
    }
    catch {
        return DEFAULT_SETTINGS;
    }
}
function clampScale(v) {
    return Math.min(SCALE_MAX, Math.max(SCALE_MIN, Math.round(v * 10) / 10));
}
const SettingsContext = createContext(null);
export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => loadSettings());
    // Apply to <html> — theme (color tokens), zoom (display scale), density
    // (spacing tokens) all read these attributes/vars in index.css.
    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute("data-theme", settings.theme);
        root.setAttribute("data-density", settings.density);
        root.style.setProperty("--display-scale", String(settings.displayScale));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }, [settings]);
    const setTheme = useCallback((theme) => {
        setSettings((prev) => ({ ...prev, theme }));
    }, []);
    const toggleTheme = useCallback(() => {
        setSettings((prev) => ({ ...prev, theme: prev.theme === "dark" ? "light" : "dark" }));
    }, []);
    const setDisplayScale = useCallback((scale) => {
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
    const setDensity = useCallback((density) => {
        setSettings((prev) => ({ ...prev, density }));
    }, []);
    const value = {
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
    return _jsx(SettingsContext.Provider, { value: value, children: children });
};
export function useSettings() {
    const ctx = useContext(SettingsContext);
    if (!ctx)
        throw new Error("useSettings must be used within a SettingsProvider");
    return ctx;
}

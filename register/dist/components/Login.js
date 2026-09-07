import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { posApi } from "../lib/api";
import { useSettings } from "../lib/settings";
import { IconSun, IconMoon, IconBackspace } from "./icons";
export const Login = ({ onSuccess }) => {
    const { theme, toggleTheme } = useSettings();
    const [username, setUsername] = useState("");
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [focusedInput, setFocusedInput] = useState("pin");
    const handleKeypadPress = (val) => {
        setError("");
        if (val === "CLEAR") {
            if (focusedInput === "pin")
                setPin("");
            else
                setUsername("");
        }
        else if (val === "BACK") {
            if (focusedInput === "pin")
                setPin((prev) => prev.slice(0, -1));
            else
                setUsername((prev) => prev.slice(0, -1));
        }
        else {
            if (focusedInput === "pin")
                setPin((prev) => prev + val);
            else
                setUsername((prev) => prev + val);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim()) {
            setError("Please enter your name / username");
            return;
        }
        if (!pin.trim()) {
            setError("Please enter your PIN / password");
            return;
        }
        setError("");
        setLoading(true);
        try {
            const res = await posApi.login(username.trim(), pin.trim());
            onSuccess({
                id: res.user.id,
                name: res.user.name,
                role: res.user.role,
                token: res.accessToken,
            });
        }
        catch (err) {
            setError(err.message || "Invalid credentials or connection error");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { style: {
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--bg-app)",
            color: "var(--text-primary)",
            padding: "20px",
            fontFamily: "var(--font-sans)",
        }, children: [_jsxs("div", { style: {
                    width: "100%",
                    maxWidth: 440,
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-lg)",
                    padding: "32px 28px",
                    boxShadow: "var(--shadow-elevated)",
                }, children: [_jsxs("div", { style: { textAlign: "center", marginBottom: 28 }, children: [_jsx("div", { style: {
                                    width: 46,
                                    height: 46,
                                    borderRadius: "var(--radius-md)",
                                    backgroundColor: "var(--accent-primary)",
                                    color: "var(--accent-primary-text)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontFamily: "var(--font-mono)",
                                    fontWeight: 700,
                                    fontSize: 17,
                                    margin: "0 auto 14px",
                                }, children: "QF" }), _jsx("h1", { style: { fontSize: 21, fontWeight: 700, letterSpacing: "-0.01em", margin: "0 0 4px" }, children: "QuickFlow Register" }), _jsx("p", { style: { fontSize: 13, color: "var(--text-muted)", margin: 0 }, children: "Cashier Sign In \u00B7 Enter your Cashier Name and PIN" })] }), error && (_jsx("div", { role: "alert", style: {
                            marginBottom: 20,
                            padding: "10px 14px",
                            borderRadius: "var(--radius-md)",
                            backgroundColor: "var(--accent-rose-bg)",
                            border: "1px solid var(--accent-rose-border)",
                            color: "var(--accent-rose)",
                            fontSize: 13,
                            fontWeight: 600,
                            textAlign: "center",
                        }, children: error })), _jsxs("form", { onSubmit: handleSubmit, style: { display: "flex", flexDirection: "column", gap: 16 }, children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "cashier-name", style: { display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }, children: "Cashier Name / Username" }), _jsx("input", { id: "cashier-name", type: "text", value: username, onFocus: () => setFocusedInput("username"), onChange: (e) => setUsername(e.target.value), placeholder: "e.g. Cashier 1 or Jane Mwangi", autoComplete: "username", style: {
                                            width: "100%",
                                            padding: "12px 14px",
                                            borderRadius: "var(--radius-md)",
                                            backgroundColor: "var(--bg-surface-subtle)",
                                            border: focusedInput === "username" ? "1px solid var(--border-focus)" : "1px solid var(--border-subtle)",
                                            color: "var(--text-primary)",
                                            fontSize: 15,
                                            outline: "none",
                                            transition: "border-color 0.15s",
                                            boxSizing: "border-box",
                                        } })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "cashier-pin", style: { display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }, children: "Cashier PIN / Password" }), _jsx("input", { id: "cashier-pin", type: "password", value: pin, onFocus: () => setFocusedInput("pin"), onChange: (e) => setPin(e.target.value), placeholder: "Enter PIN", autoComplete: "current-password", style: {
                                            width: "100%",
                                            padding: "12px 14px",
                                            borderRadius: "var(--radius-md)",
                                            backgroundColor: "var(--bg-surface-subtle)",
                                            border: focusedInput === "pin" ? "1px solid var(--border-focus)" : "1px solid var(--border-subtle)",
                                            color: "var(--text-primary)",
                                            fontSize: 18,
                                            letterSpacing: "0.2em",
                                            fontFamily: "var(--font-mono)",
                                            outline: "none",
                                            transition: "border-color 0.15s",
                                            boxSizing: "border-box",
                                        } })] }), _jsx("div", { style: {
                                    display: "grid",
                                    gridTemplateColumns: "repeat(3, 1fr)",
                                    gap: 8,
                                    marginTop: 8,
                                }, children: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "CLEAR", "0", "BACK"].map((val) => (_jsx("button", { type: "button", onClick: () => handleKeypadPress(val), style: {
                                        height: 48,
                                        borderRadius: "var(--radius-md)",
                                        backgroundColor: "var(--bg-surface-subtle)",
                                        border: "1px solid var(--border-subtle)",
                                        color: val === "CLEAR" ? "var(--accent-rose)" : val === "BACK" ? "var(--accent-amber)" : "var(--text-primary)",
                                        fontSize: val === "CLEAR" || val === "BACK" ? 11 : 18,
                                        fontWeight: 700,
                                        fontFamily: val === "CLEAR" || val === "BACK" ? "var(--font-sans)" : "var(--font-mono)",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "background-color 0.15s, transform 0.1s",
                                    }, onMouseDown: (e) => (e.currentTarget.style.transform = "scale(0.96)"), onMouseUp: (e) => (e.currentTarget.style.transform = "scale(1)"), children: val === "BACK" ? _jsx(IconBackspace, { size: 18 }) : val }, val))) }), _jsx("button", { type: "submit", disabled: loading, style: {
                                    marginTop: 12,
                                    width: "100%",
                                    height: 48,
                                    borderRadius: "var(--radius-md)",
                                    backgroundColor: "var(--accent-primary)",
                                    color: "var(--accent-primary-text)",
                                    border: "none",
                                    fontSize: 15,
                                    fontWeight: 700,
                                    cursor: loading ? "not-allowed" : "pointer",
                                    opacity: loading ? 0.7 : 1,
                                    transition: "background-color 0.15s",
                                }, children: loading ? "Authenticating..." : "Unlock Till & Access POS" })] })] }), _jsx("div", { style: { marginTop: 24, display: "flex", alignItems: "center", gap: 16 }, children: _jsx("button", { onClick: toggleTheme, style: {
                        background: "none",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-pill)",
                        padding: "8px 16px",
                        minHeight: "var(--touch-min)",
                        color: "var(--text-muted)",
                        fontSize: 12,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                    }, children: theme === "dark" ? _jsxs(_Fragment, { children: [_jsx(IconSun, { size: 14 }), _jsx("span", { children: "Light Mode" })] }) : _jsxs(_Fragment, { children: [_jsx(IconMoon, { size: 14 }), _jsx("span", { children: "Dark Mode" })] }) }) })] }));
};

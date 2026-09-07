import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { formatCurrency } from "../lib/cart";
import { completeCashSale, initiateMpesaStkSale, completeMpesaTillSale, pollPaymentStatus, openDrawer, } from "../lib/checkout";
import { IconCash, IconPhone, IconClose, IconCheck, IconSync } from "./icons";
const TILL_NUMBER = "3636288";
export const TenderModal = ({ isOpen, onClose, items, totals, onCompleteSale, }) => {
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [cashTenderedCents, setCashTenderedCents] = useState(() => totals.grandTotalCents);
    const [rawInput, setRawInput] = useState(() => (totals.grandTotalCents / 100).toFixed(0));
    // M-Pesa STK Push state
    const [phoneNumber, setPhoneNumber] = useState("");
    const [stkPending, setStkPending] = useState(false);
    const [stkCountdown, setStkCountdown] = useState(60);
    const [stkStatusText, setStkStatusText] = useState("Waiting for customer PIN...");
    const pollAbortRef = useRef(false);
    const countdownTimerRef = useRef(null);
    // M-Pesa Till state
    const [mpesaTillCode, setMpesaTillCode] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [lastReceipt, setLastReceipt] = useState(null);
    const customInputRef = useRef(null);
    // Reset states when modal opens
    useEffect(() => {
        if (isOpen) {
            setCashTenderedCents(totals.grandTotalCents);
            setRawInput(totals.grandTotalCents ? (totals.grandTotalCents / 100).toFixed(0) : "");
            setErrorMsg(null);
            setIsSuccess(false);
            setLastReceipt(null);
            setIsProcessing(false);
            setStkPending(false);
            setStkCountdown(60);
            pollAbortRef.current = false;
            if (countdownTimerRef.current)
                clearInterval(countdownTimerRef.current);
        }
    }, [isOpen, totals.grandTotalCents]);
    // Clean up countdown on unmount
    useEffect(() => {
        return () => {
            pollAbortRef.current = true;
            if (countdownTimerRef.current)
                clearInterval(countdownTimerRef.current);
        };
    }, []);
    if (!isOpen)
        return null;
    const changeDueCents = Math.max(0, cashTenderedCents - totals.grandTotalCents);
    const isExactOrMore = cashTenderedCents >= totals.grandTotalCents;
    const isBelowTotal = cashTenderedCents > 0 && cashTenderedCents < totals.grandTotalCents;
    const isZeroItems = items.length === 0;
    const MAX_CASH_SHILLINGS = 999_999;
    const handleQuickCash = (amountShillings) => {
        const cents = amountShillings * 100;
        setCashTenderedCents(cents);
        setRawInput(amountShillings.toFixed(0));
        setErrorMsg(null);
        setTimeout(() => customInputRef.current?.select(), 50);
    };
    const handleCustomInputChange = (e) => {
        let raw = e.target.value;
        if (!/^\d*\.?\d{0,2}$/.test(raw))
            return;
        if (/^0\d/.test(raw)) {
            raw = raw.replace(/^0+/, "") || "0";
        }
        const parsed = parseFloat(raw);
        if (!isNaN(parsed) && parsed > MAX_CASH_SHILLINGS)
            return;
        setRawInput(raw);
        setCashTenderedCents(isNaN(parsed) ? 0 : Math.round(parsed * 100));
        setErrorMsg(null);
    };
    const handleCustomInputBlur = () => {
        const parsed = parseFloat(rawInput);
        const amount = isNaN(parsed) || parsed < 0 ? 0 : Math.min(parsed, MAX_CASH_SHILLINGS);
        setRawInput(amount === 0 ? "" : amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2));
        setCashTenderedCents(Math.round(amount * 100));
    };
    // ─── Cash Sale Execution ──────────────────────────────────────────────────
    const handleCashConfirm = async () => {
        if (isZeroItems) {
            setErrorMsg("Cart is empty");
            return;
        }
        if (!isExactOrMore) {
            setErrorMsg(`Short by ${formatCurrency(totals.grandTotalCents - cashTenderedCents)}`);
            return;
        }
        setIsProcessing(true);
        setErrorMsg(null);
        try {
            const result = await completeCashSale(items, totals, cashTenderedCents);
            setIsSuccess(true);
            setLastReceipt(result);
            onCompleteSale(result);
        }
        catch (err) {
            setErrorMsg(err.message || String(err));
        }
        finally {
            setIsProcessing(false);
        }
    };
    // ─── M-Pesa STK Push Execution ───────────────────────────────────────────
    const handleStkInitiate = async () => {
        if (isZeroItems) {
            setErrorMsg("Cart is empty");
            return;
        }
        const cleanPhone = phoneNumber.trim().replace(/\D/g, "");
        if (!/^(?:\+?254|0)?[71]\d{8}$/.test(cleanPhone)) {
            setErrorMsg("Enter a valid Kenyan mobile number (e.g. 0712345678 or 254712345678)");
            return;
        }
        setIsProcessing(true);
        setErrorMsg(null);
        setStkPending(true);
        setStkCountdown(60);
        setStkStatusText("Sending STK prompt to customer phone...");
        pollAbortRef.current = false;
        try {
            const initResult = await initiateMpesaStkSale(items, totals, cleanPhone);
            setStkStatusText("Prompt sent. Waiting for customer PIN...");
            // Start countdown timer
            if (countdownTimerRef.current)
                clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = setInterval(() => {
                setStkCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(countdownTimerRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            // Poll for completion
            const paymentId = initResult.payment.id;
            const pollResult = await pollPaymentStatus(paymentId, (status) => {
                if (status === "pending") {
                    setStkStatusText("Waiting for customer PIN entry...");
                }
            }, 60000);
            if (countdownTimerRef.current)
                clearInterval(countdownTimerRef.current);
            if (pollAbortRef.current) {
                setStkPending(false);
                setIsProcessing(false);
                return;
            }
            if (pollResult.status === "captured") {
                setStkPending(false);
                setIsSuccess(true);
                setLastReceipt(pollResult.receipt);
                onCompleteSale({
                    transaction: pollResult.payment?.transaction,
                    payment: pollResult.payment,
                    receipt: pollResult.receipt,
                });
                setTimeout(() => {
                    // brief pause so cashier can see success state before Done button closes
                }, 3000);
            }
            else if (pollResult.status === "failed") {
                setStkPending(false);
                setErrorMsg("Customer cancelled or payment failed on phone");
            }
            else {
                setStkPending(false);
                setErrorMsg("STK prompt timed out. Ask customer to pay via Buy Goods Till 3636288 or retry");
            }
        }
        catch (err) {
            if (countdownTimerRef.current)
                clearInterval(countdownTimerRef.current);
            setStkPending(false);
            setErrorMsg(err.message || "Failed to initiate M-Pesa STK Push");
        }
        finally {
            setIsProcessing(false);
        }
    };
    const handleCancelStk = () => {
        pollAbortRef.current = true;
        if (countdownTimerRef.current)
            clearInterval(countdownTimerRef.current);
        setStkPending(false);
        setIsProcessing(false);
        setErrorMsg("STK push cancelled. Select Cash or Buy Goods Till");
    };
    // ─── M-Pesa Buy Goods Till Manual Code Execution ─────────────────────────
    const handleTillConfirm = async () => {
        if (isZeroItems) {
            setErrorMsg("Cart is empty");
            return;
        }
        const code = mpesaTillCode.trim().toUpperCase();
        if (!/^[A-Z0-9]{8,14}$/.test(code)) {
            setErrorMsg("Enter a valid M-Pesa transaction code (e.g. QHN7ACKQOP)");
            return;
        }
        setIsProcessing(true);
        setErrorMsg(null);
        try {
            const result = await completeMpesaTillSale(items, totals, code);
            setIsSuccess(true);
            setLastReceipt(result);
            onCompleteSale(result);
        }
        catch (err) {
            setErrorMsg(err.message || "Failed to record Till payment");
        }
        finally {
            setIsProcessing(false);
        }
    };
    const handleNoSaleDrawer = async () => {
        setErrorMsg(null);
        try {
            await openDrawer({ reason: "no_sale", amountCents: 0 });
            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 800);
        }
        catch (e) {
            setErrorMsg(e.message);
        }
    };
    return (_jsx("div", { style: {
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.55)",
            backdropFilter: "blur(2px)",
            padding: 16,
        }, onClick: () => {
            if (!stkPending && !isProcessing)
                onClose();
        }, children: _jsxs("div", { style: {
                width: "100%",
                maxWidth: 540,
                maxHeight: "90vh",
                overflowY: "auto",
                backgroundColor: "var(--bg-surface)",
                borderRadius: "var(--radius-xl)",
                border: "1px solid var(--border-strong)",
                boxShadow: "var(--shadow-elevated)",
                overflowX: "hidden",
                display: "flex",
                flexDirection: "column",
            }, onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { style: {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "18px 24px",
                        borderBottom: "1px solid var(--border-subtle)",
                        position: "sticky",
                        top: 0,
                        backgroundColor: "var(--bg-surface)",
                        zIndex: 1,
                    }, children: [_jsxs("div", { children: [_jsx("span", { style: {
                                        fontSize: 11,
                                        fontWeight: 700,
                                        letterSpacing: "0.08em",
                                        textTransform: "uppercase",
                                        color: "var(--accent-terracotta)",
                                    }, children: "Checkout Tender" }), _jsx("h3", { style: { fontSize: 18, fontWeight: 700, marginTop: 2 }, children: "Payment Processing" })] }), _jsx("button", { onClick: onClose, disabled: stkPending || isProcessing, style: {
                                background: "none",
                                border: "none",
                                color: "var(--text-muted)",
                                cursor: stkPending || isProcessing ? "not-allowed" : "pointer",
                                padding: 6,
                                borderRadius: "var(--radius-pill)",
                                display: "flex",
                                alignItems: "center",
                                opacity: stkPending || isProcessing ? 0.4 : 1,
                            }, children: _jsx(IconClose, { size: 18 }) })] }), _jsxs("div", { style: { padding: 24, display: "flex", flexDirection: "column", gap: 18 }, children: [_jsxs("div", { style: {
                                padding: "16px 18px",
                                borderRadius: "var(--radius-lg)",
                                backgroundColor: "var(--bg-surface-elevated)",
                                border: "1px solid var(--border-subtle)",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }, children: [_jsxs("div", { children: [_jsx("span", { style: { fontSize: 12, color: "var(--text-muted)" }, children: "Total Payable" }), _jsxs("div", { style: { fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }, children: [totals.itemCount, " items \u00B7 incl. VAT"] }), items.length > 0 && (_jsx("div", { style: { fontSize: 10, color: "var(--text-muted)", marginTop: 4, maxWidth: 220, lineHeight: 1.4 }, children: items.map((i) => `${i.name} x ${i.quantity}`).join(", ").substring(0, 80) }))] }), _jsx("span", { style: {
                                        fontFamily: "var(--font-mono)",
                                        fontSize: 26,
                                        fontWeight: 800,
                                        letterSpacing: "-0.03em",
                                        color: "var(--text-primary)",
                                    }, children: formatCurrency(totals.grandTotalCents) })] }), _jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }, children: [
                                { id: "cash", label: "Cash", icon: _jsx(IconCash, { size: 16 }) },
                                { id: "mpesa_stk", label: "M-Pesa STK", icon: _jsx(IconPhone, { size: 16 }) },
                                { id: "mpesa_till", label: `Till ${TILL_NUMBER}`, icon: _jsx(IconPhone, { size: 16 }) },
                            ].map((method) => {
                                const active = paymentMethod === method.id;
                                return (_jsxs("button", { disabled: stkPending || isProcessing, onClick: () => {
                                        setPaymentMethod(method.id);
                                        setErrorMsg(null);
                                    }, style: {
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: 6,
                                        padding: "10px 8px",
                                        borderRadius: "var(--radius-md)",
                                        backgroundColor: active ? "var(--accent-primary)" : "var(--bg-surface-elevated)",
                                        color: active ? "var(--accent-primary-text)" : "var(--text-secondary)",
                                        border: `1px solid ${active ? "transparent" : "var(--border-subtle)"}`,
                                        cursor: stkPending || isProcessing ? "not-allowed" : "pointer",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        boxShadow: "none",
                                        transition: "all 0.18s var(--ease-spring)",
                                        opacity: stkPending || isProcessing ? 0.6 : 1,
                                    }, children: [method.icon, method.label] }, method.id));
                            }) }), paymentMethod === "cash" && (_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 14 }, children: [_jsxs("div", { children: [_jsx("label", { style: { fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 8 }, children: "Quick Select (KES)" }), _jsxs("div", { style: { display: "flex", gap: 6 }, children: [[500, 1000, 2000, 5000].map((shillings) => {
                                                    const isActive = cashTenderedCents === shillings * 100;
                                                    return (_jsx("button", { onClick: () => handleQuickCash(shillings), style: {
                                                            flex: 1,
                                                            padding: "8px 0",
                                                            fontFamily: "var(--font-mono)",
                                                            fontSize: 12,
                                                            fontWeight: 700,
                                                            backgroundColor: isActive ? "var(--accent-primary-bg)" : "var(--bg-surface-elevated)",
                                                            border: `1px solid ${isActive ? "var(--accent-primary-border)" : "var(--border-subtle)"}`,
                                                            borderRadius: "var(--radius-md)",
                                                            color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                                                            cursor: "pointer",
                                                            transition: "all 0.18s var(--ease-spring)",
                                                        }, children: shillings >= 1000 ? `${shillings / 1000}K` : shillings }, shillings));
                                                }), _jsx("button", { onClick: () => {
                                                        const exact = totals.grandTotalCents;
                                                        setCashTenderedCents(exact);
                                                        setRawInput((exact / 100).toFixed(0));
                                                        setErrorMsg(null);
                                                    }, style: {
                                                        flex: 1,
                                                        padding: "8px 0",
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        backgroundColor: cashTenderedCents === totals.grandTotalCents ? "var(--accent-primary-bg)" : "var(--bg-surface-elevated)",
                                                        border: `1px solid ${cashTenderedCents === totals.grandTotalCents ? "var(--accent-primary-border)" : "var(--border-subtle)"}`,
                                                        borderRadius: "var(--radius-md)",
                                                        color: cashTenderedCents === totals.grandTotalCents ? "var(--accent-primary)" : "var(--text-muted)",
                                                        cursor: "pointer",
                                                        transition: "all 0.18s var(--ease-spring)",
                                                        letterSpacing: "0.01em",
                                                    }, children: "Exact" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "cash-tendered-input", style: {
                                                fontSize: 11,
                                                fontWeight: 600,
                                                color: isBelowTotal ? "var(--accent-rose)" : "var(--text-muted)",
                                                letterSpacing: "0.06em",
                                                textTransform: "uppercase",
                                                display: "block",
                                                marginBottom: 8,
                                                transition: "color 0.2s ease",
                                            }, children: "Cash Tendered (KES)" }), _jsxs("div", { style: { position: "relative" }, children: [_jsx("span", { style: {
                                                        position: "absolute",
                                                        left: 16,
                                                        top: "50%",
                                                        transform: "translateY(-50%)",
                                                        fontFamily: "var(--font-mono)",
                                                        fontSize: 13,
                                                        fontWeight: 700,
                                                        color: isBelowTotal ? "var(--accent-rose)" : "var(--text-muted)",
                                                        pointerEvents: "none",
                                                        userSelect: "none",
                                                        transition: "color 0.2s ease",
                                                    }, children: "KES" }), _jsx("input", { id: "cash-tendered-input", ref: customInputRef, type: "text", inputMode: "decimal", value: rawInput, onChange: handleCustomInputChange, onBlur: handleCustomInputBlur, onFocus: (e) => {
                                                        e.currentTarget.select();
                                                        e.currentTarget.style.borderColor = isBelowTotal
                                                            ? "var(--accent-rose)"
                                                            : "var(--border-focus)";
                                                    }, placeholder: "Enter amount", style: {
                                                        width: "100%",
                                                        height: 50,
                                                        padding: "0 16px 0 52px",
                                                        fontFamily: "var(--font-mono)",
                                                        fontSize: 19,
                                                        fontWeight: 700,
                                                        letterSpacing: "-0.02em",
                                                        backgroundColor: isBelowTotal
                                                            ? "var(--accent-rose-bg)"
                                                            : "var(--bg-surface-elevated)",
                                                        color: isBelowTotal ? "var(--accent-rose)" : "var(--text-primary)",
                                                        border: `1px solid ${isBelowTotal ? "var(--accent-rose-border)" : "var(--border-subtle)"}`,
                                                        borderRadius: "var(--radius-md)",
                                                        outline: "none",
                                                    } })] }), isBelowTotal && (_jsxs("div", { style: {
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 5,
                                                marginTop: 6,
                                                fontSize: 11.5,
                                                fontWeight: 600,
                                                color: "var(--accent-rose)",
                                            }, children: ["Short by ", formatCurrency(totals.grandTotalCents - cashTenderedCents)] }))] }), _jsxs("div", { style: {
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: 12,
                                        padding: "12px 14px",
                                        borderRadius: "var(--radius-md)",
                                        backgroundColor: "var(--bg-surface-elevated)",
                                        border: `1px solid ${changeDueCents > 0
                                            ? "var(--accent-sage-border)"
                                            : "var(--border-subtle)"}`,
                                    }, children: [_jsxs("div", { children: [_jsx("span", { style: { fontSize: 11, color: "var(--text-muted)" }, children: "Tendered" }), _jsx("div", { style: { fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 800, marginTop: 3 }, children: formatCurrency(cashTenderedCents) })] }), _jsxs("div", { style: { textAlign: "right" }, children: [_jsx("span", { style: { fontSize: 11, color: "var(--text-muted)" }, children: "Change Due" }), _jsx("div", { style: {
                                                        fontFamily: "var(--font-mono)",
                                                        fontSize: 16,
                                                        fontWeight: 800,
                                                        marginTop: 3,
                                                        color: changeDueCents > 0 ? "var(--accent-sage)" : "var(--text-muted)",
                                                    }, children: formatCurrency(changeDueCents) })] })] }), _jsxs("div", { style: { display: "flex", gap: 8 }, children: [_jsx("button", { onClick: handleNoSaleDrawer, type: "button", style: {
                                                flex: 1,
                                                padding: "8px 12px",
                                                borderRadius: "var(--radius-pill)",
                                                backgroundColor: "var(--bg-surface-elevated)",
                                                border: "1px solid var(--border-subtle)",
                                                color: "var(--text-secondary)",
                                                fontSize: 11,
                                                fontWeight: 600,
                                                cursor: "pointer",
                                            }, children: "No-Sale Drawer" }), _jsx("button", { onClick: async () => {
                                                try {
                                                    await openDrawer({ reason: "manager_override", amountCents: 0 });
                                                }
                                                catch (e) {
                                                    setErrorMsg(e.message);
                                                }
                                            }, type: "button", style: {
                                                flex: 1,
                                                padding: "8px 12px",
                                                borderRadius: "var(--radius-pill)",
                                                backgroundColor: "var(--bg-surface-elevated)",
                                                border: "1px solid var(--border-subtle)",
                                                color: "var(--text-secondary)",
                                                fontSize: 11,
                                                fontWeight: 600,
                                                cursor: "pointer",
                                            }, children: "Manager Override" })] })] })), paymentMethod === "mpesa_stk" && (_jsx("div", { style: { display: "flex", flexDirection: "column", gap: 14 }, children: !stkPending ? (_jsx(_Fragment, { children: _jsxs("div", { children: [_jsx("label", { style: { fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }, children: "Customer Mobile Number" }), _jsx("input", { type: "tel", value: phoneNumber, onChange: (e) => setPhoneNumber(e.target.value), placeholder: "e.g. 0712345678 or 254712345678", disabled: isProcessing, style: {
                                                width: "100%",
                                                height: 48,
                                                padding: "0 16px",
                                                fontSize: 16,
                                                fontFamily: "var(--font-mono)",
                                                backgroundColor: "var(--bg-surface-elevated)",
                                                color: "var(--text-primary)",
                                                border: "1px solid var(--border-subtle)",
                                                borderRadius: "var(--radius-md)",
                                                outline: "none",
                                            } }), _jsxs("div", { style: { fontSize: 11, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.45 }, children: ["Customer will receive an instant prompt on their phone to enter their M-Pesa PIN for ", formatCurrency(totals.grandTotalCents), "."] })] }) })) : (_jsxs("div", { style: {
                                    padding: 20,
                                    borderRadius: "var(--radius-lg)",
                                    backgroundColor: "var(--bg-surface-elevated)",
                                    border: "1px solid var(--border-strong)",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    textAlign: "center",
                                    gap: 12,
                                }, children: [_jsx("div", { style: {
                                            width: 44,
                                            height: 44,
                                            borderRadius: "50%",
                                            backgroundColor: "var(--accent-primary-bg)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "var(--accent-primary)",
                                            animation: "spin 2s linear infinite",
                                        }, children: _jsx(IconSync, { size: 22 }) }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }, children: stkStatusText }), _jsxs("div", { style: { fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }, children: ["Phone: ", phoneNumber, " \u00B7 Amount: ", formatCurrency(totals.grandTotalCents)] })] }), _jsxs("div", { style: {
                                            fontSize: 12,
                                            fontFamily: "var(--font-mono)",
                                            fontWeight: 700,
                                            color: stkCountdown < 10 ? "var(--accent-rose)" : "var(--accent-primary)",
                                            padding: "4px 12px",
                                            borderRadius: "var(--radius-pill)",
                                            backgroundColor: "var(--bg-surface)",
                                            border: "1px solid var(--border-subtle)",
                                        }, children: ["Timeout in ", stkCountdown, "s"] }), _jsx("button", { onClick: handleCancelStk, style: {
                                            marginTop: 6,
                                            padding: "6px 16px",
                                            borderRadius: "var(--radius-pill)",
                                            backgroundColor: "transparent",
                                            border: "1px solid var(--border-subtle)",
                                            color: "var(--accent-rose)",
                                            fontSize: 12,
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }, children: "Cancel STK Push" })] })) })), paymentMethod === "mpesa_till" && (_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 14 }, children: [_jsxs("div", { style: {
                                        padding: "16px 20px",
                                        borderRadius: "var(--radius-lg)",
                                        backgroundColor: "var(--accent-primary-bg)",
                                        border: "1px solid var(--accent-primary-border)",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        textAlign: "center",
                                        gap: 4,
                                    }, children: [_jsx("span", { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent-primary)" }, children: "Lipa na M-Pesa Buy Goods Till" }), _jsx("span", { style: { fontFamily: "var(--font-mono)", fontSize: 32, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "0.04em" }, children: TILL_NUMBER }), _jsxs("span", { style: { fontSize: 12, color: "var(--text-secondary)" }, children: ["Instruct customer to pay ", formatCurrency(totals.grandTotalCents), " to Till ", TILL_NUMBER] })] }), _jsxs("div", { children: [_jsx("label", { style: { fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }, children: "M-Pesa Transaction Code" }), _jsx("input", { type: "text", value: mpesaTillCode, onChange: (e) => setMpesaTillCode(e.target.value.toUpperCase()), placeholder: "e.g. QHN7ACKQOP", maxLength: 14, style: {
                                                width: "100%",
                                                height: 48,
                                                padding: "0 16px",
                                                fontSize: 18,
                                                fontFamily: "var(--font-mono)",
                                                fontWeight: 700,
                                                letterSpacing: "0.08em",
                                                textTransform: "uppercase",
                                                backgroundColor: "var(--bg-surface-elevated)",
                                                color: "var(--text-primary)",
                                                border: "1px solid var(--border-subtle)",
                                                borderRadius: "var(--radius-md)",
                                                outline: "none",
                                            } }), _jsx("div", { style: { fontSize: 11, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.45 }, children: "Enter the confirmation code from customer SMS or merchant till statement. Use this manual method if STK push or network is unavailable." })] })] })), errorMsg && (_jsx("div", { style: {
                                padding: "10px 14px",
                                borderRadius: "var(--radius-md)",
                                backgroundColor: "var(--accent-rose-bg)",
                                border: "1px solid var(--accent-rose-border)",
                                color: "var(--accent-rose)",
                                fontSize: 12,
                                fontWeight: 600,
                                lineHeight: 1.4,
                            }, children: errorMsg })), isSuccess && (_jsxs("div", { style: {
                                borderRadius: "var(--radius-lg)",
                                border: "1px solid var(--accent-sage-border)",
                                backgroundColor: "var(--bg-surface-elevated)",
                                overflow: "hidden",
                            }, children: [_jsxs("div", { style: {
                                        backgroundColor: "var(--accent-sage)",
                                        color: "var(--bg-app)",
                                        textAlign: "center",
                                        padding: "14px 16px 12px",
                                    }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginBottom: 2 }, children: [_jsx(IconCheck, { size: 16 }), _jsx("span", { style: { fontWeight: 800, fontSize: 14, letterSpacing: "0.01em" }, children: "Sale Complete" })] }), _jsx("div", { style: { fontSize: 11, opacity: 0.85 }, children: new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi", dateStyle: "medium", timeStyle: "short" }) })] }), _jsx("div", { style: { padding: "12px 16px", borderBottom: "1px dashed var(--border-subtle)" }, children: items.map((item) => (_jsxs("div", { style: {
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "baseline",
                                            gap: 8,
                                            fontSize: 12,
                                            padding: "3px 0",
                                        }, children: [_jsxs("span", { style: { flex: 1, color: "var(--text-primary)", fontWeight: 500 }, children: [item.name, item.quantity > 1 && (_jsxs("span", { style: { color: "var(--text-muted)", fontWeight: 400 }, children: [" \u00D7", item.quantity] }))] }), _jsx("span", { style: { fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-primary)", fontWeight: 600 }, children: formatCurrency(item.lineTotalCents) })] }, item.id))) }), _jsxs("div", { style: { padding: "10px 16px", borderBottom: "1px dashed var(--border-subtle)", display: "flex", flexDirection: "column", gap: 4 }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }, children: [_jsx("span", { children: "Subtotal" }), _jsx("span", { style: { fontFamily: "var(--font-mono)" }, children: formatCurrency(totals.subtotalCents) })] }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }, children: [_jsx("span", { children: "VAT" }), _jsx("span", { style: { fontFamily: "var(--font-mono)" }, children: formatCurrency(totals.totalTaxCents) })] }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800, color: "var(--text-primary)", marginTop: 2 }, children: [_jsx("span", { children: "Total" }), _jsx("span", { style: { fontFamily: "var(--font-mono)" }, children: formatCurrency(totals.grandTotalCents) })] })] }), _jsxs("div", { style: { padding: "10px 16px", display: "flex", flexDirection: "column", gap: 4 }, children: [paymentMethod === "cash" && (_jsxs(_Fragment, { children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-secondary)" }, children: [_jsx("span", { children: "Cash Tendered" }), _jsx("span", { style: { fontFamily: "var(--font-mono)" }, children: formatCurrency(cashTenderedCents) })] }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "var(--accent-sage)" }, children: [_jsx("span", { children: "Change Due" }), _jsx("span", { style: { fontFamily: "var(--font-mono)" }, children: formatCurrency(changeDueCents) })] })] })), paymentMethod === "mpesa_stk" && (_jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-secondary)" }, children: [_jsxs("span", { children: ["M-Pesa STK \u2014 ", phoneNumber] }), _jsx("span", { style: { fontFamily: "var(--font-mono)", color: "var(--accent-sage)", fontWeight: 700 }, children: formatCurrency(totals.grandTotalCents) })] })), paymentMethod === "mpesa_till" && (_jsxs(_Fragment, { children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-secondary)" }, children: [_jsxs("span", { children: ["M-Pesa Till ", TILL_NUMBER] }), _jsx("span", { style: { fontFamily: "var(--font-mono)", color: "var(--accent-sage)", fontWeight: 700 }, children: formatCurrency(totals.grandTotalCents) })] }), mpesaTillCode && (_jsxs("div", { style: { fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }, children: ["Ref: ", mpesaTillCode] }))] }))] })] }))] }), _jsxs("div", { style: {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: 12,
                        padding: "14px 20px",
                        borderTop: "1px solid var(--border-subtle)",
                        backgroundColor: "var(--bg-surface-subtle)",
                    }, children: [_jsx("button", { onClick: onClose, disabled: stkPending || isProcessing, style: {
                                padding: "10px 20px",
                                borderRadius: "var(--radius-pill)",
                                backgroundColor: "transparent",
                                border: "1px solid var(--border-subtle)",
                                color: "var(--text-secondary)",
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: stkPending || isProcessing ? "not-allowed" : "pointer",
                                opacity: stkPending || isProcessing ? 0.6 : 1,
                            }, children: "Cancel" }), paymentMethod === "cash" && (_jsx("button", { onClick: isSuccess ? onClose : handleCashConfirm, disabled: isProcessing || (!isSuccess && (!isExactOrMore || isZeroItems)), className: "pos-btn-pill pos-btn-pill-primary", style: {
                                padding: "10px 24px",
                                backgroundColor: isSuccess ? "var(--accent-sage)" : "var(--accent-primary)",
                                opacity: (isProcessing || (!isSuccess && (!isExactOrMore || isZeroItems))) ? 0.5 : 1,
                                cursor: (isProcessing || (!isSuccess && (!isExactOrMore || isZeroItems))) ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                fontSize: 13,
                                fontWeight: 700,
                            }, children: isSuccess ? (_jsxs(_Fragment, { children: [_jsx(IconCheck, { size: 16 }), _jsx("span", { children: "Done" })] })) : isProcessing ? (_jsx("span", { children: "Processing..." })) : (_jsx("span", { children: "Complete Sale (Cash)" })) })), paymentMethod === "mpesa_stk" && !stkPending && (_jsx("button", { onClick: handleStkInitiate, disabled: isProcessing || isZeroItems || !phoneNumber.trim(), className: "pos-btn-pill pos-btn-pill-primary", style: {
                                padding: "10px 24px",
                                backgroundColor: "var(--accent-primary)",
                                opacity: (isProcessing || isZeroItems || !phoneNumber.trim()) ? 0.5 : 1,
                                cursor: (isProcessing || isZeroItems || !phoneNumber.trim()) ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                fontSize: 13,
                                fontWeight: 700,
                            }, children: isProcessing ? _jsx("span", { children: "Sending..." }) : _jsx("span", { children: "Send STK Push" }) })), paymentMethod === "mpesa_till" && (_jsx("button", { onClick: isSuccess ? onClose : handleTillConfirm, disabled: isProcessing || (!isSuccess && (isZeroItems || mpesaTillCode.trim().length < 8)), className: "pos-btn-pill pos-btn-pill-primary", style: {
                                padding: "10px 24px",
                                backgroundColor: isSuccess ? "var(--accent-sage)" : "var(--accent-primary)",
                                opacity: (isProcessing || (!isSuccess && (isZeroItems || mpesaTillCode.trim().length < 8))) ? 0.5 : 1,
                                cursor: (isProcessing || (!isSuccess && (isZeroItems || mpesaTillCode.trim().length < 8))) ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                fontSize: 13,
                                fontWeight: 700,
                            }, children: isSuccess ? (_jsxs(_Fragment, { children: [_jsx(IconCheck, { size: 16 }), _jsx("span", { children: "Done" })] })) : isProcessing ? (_jsx("span", { children: "Recording..." })) : (_jsx("span", { children: "Confirm Till Payment" })) }))] })] }) }));
};

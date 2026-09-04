import React, { useState, useRef } from "react";
import type { CartTotals } from "../lib/types";
import { formatCurrency } from "../lib/cart";
import { IconCash, IconPhone, IconClose, IconCheck } from "./icons";

interface TenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  totals: CartTotals;
  onCompleteSale: () => void;
}

export const TenderModal: React.FC<TenderModalProps> = ({
  isOpen,
  onClose,
  totals,
  onCompleteSale,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa_stk" | "mpesa_till">("cash");
  const [cashTenderedCents, setCashTenderedCents] = useState<number>(() => totals.grandTotalCents);
  const [rawInput, setRawInput] = useState<string>(() => (totals.grandTotalCents / 100).toFixed(0));
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);
  const customInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const changeDueCents = Math.max(0, cashTenderedCents - totals.grandTotalCents);
  const isExactOrMore = cashTenderedCents >= totals.grandTotalCents;
  // Show inline error when a non-zero amount has been entered but is still short
  const isBelowTotal = cashTenderedCents > 0 && cashTenderedCents < totals.grandTotalCents;

  const MAX_CASH_SHILLINGS = 999_999; // Upper bound: KES 999,999

  const handleQuickCash = (amountShillings: number) => {
    const cents = amountShillings * 100;
    setCashTenderedCents(cents);
    setRawInput(amountShillings.toFixed(0));
    // Select the input so the cashier can immediately overtype
    setTimeout(() => customInputRef.current?.select(), 50);
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // 1. Only allow digits + at most one decimal point with up to 2 decimal places
    if (!/^\d*\.?\d{0,2}$/.test(raw)) return;

    // 2. Strip leading zeros — "0007" → "7", but preserve "0" alone and "0.X"
    if (/^0\d/.test(raw)) {
      raw = raw.replace(/^0+/, "") || "0";
    }

    // 3. Hard cap: reject anything that would exceed KES 999,999
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed > MAX_CASH_SHILLINGS) return;

    setRawInput(raw);
    setCashTenderedCents(isNaN(parsed) ? 0 : Math.round(parsed * 100));
  };

  const handleCustomInputBlur = () => {
    // Normalise to a clean number string on blur
    const parsed = parseFloat(rawInput);
    const amount = isNaN(parsed) || parsed < 0 ? 0 : Math.min(parsed, MAX_CASH_SHILLINGS);
    setRawInput(amount === 0 ? "" : amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2));
    setCashTenderedCents(Math.round(amount * 100));
  };

  const handleConfirm = () => {
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onCompleteSale();
      onClose();
    }, 1200);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(20, 20, 19, 0.7)",
        backdropFilter: "blur(8px)",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border-strong)",
          boxShadow: "var(--shadow-elevated)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--accent-terracotta)",
              }}
            >
              Checkout Tender
            </span>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>
              Payment Processing
            </h3>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: 6,
              borderRadius: "var(--radius-pill)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <IconClose size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Total Due Banner */}
          <div
            style={{
              padding: "18px 20px",
              borderRadius: "var(--radius-lg)",
              backgroundColor: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Total Payable</span>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                {totals.itemCount} items · incl. VAT
              </div>
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 27,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "var(--text-primary)",
              }}
            >
              {formatCurrency(totals.grandTotalCents)}
            </span>
          </div>

          {/* Payment Method Selector (Pills) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { id: "cash", label: "Cash", icon: <IconCash size={16} /> },
              { id: "mpesa_stk", label: "M-Pesa STK", icon: <IconPhone size={16} /> },
              { id: "mpesa_till", label: "Buy Goods", icon: <IconPhone size={16} /> },
            ].map((method) => {
              const active = paymentMethod === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as any)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    padding: "12px 8px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: active ? "var(--accent-terracotta)" : "var(--bg-surface-elevated)",
                    color: active ? "#ffffff" : "var(--text-secondary)",
                    border: `1px solid ${active ? "transparent" : "var(--border-subtle)"}`,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    boxShadow: active ? "0 4px 12px rgba(217, 119, 87, 0.3)" : "none",
                    transition: "all 0.18s var(--ease-spring)",
                  }}
                >
                  {method.icon}
                  {method.label}
                </button>
              );
            })}
          </div>

          {/* Cash Payment Details */}
          {paymentMethod === "cash" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Quick denomination chips */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                  Quick Select
                </label>
                <div style={{ display: "flex", gap: 6 }}>
                  {[500, 1000, 2000, 5000].map((shillings) => {
                    const isActive = cashTenderedCents === shillings * 100;
                    return (
                      <button
                        key={shillings}
                        onClick={() => handleQuickCash(shillings)}
                        style={{
                          flex: 1,
                          padding: "8px 0",
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                          fontWeight: 700,
                          backgroundColor: isActive ? "var(--accent-terracotta-bg)" : "var(--bg-surface-elevated)",
                          border: `1px solid ${isActive ? "rgba(217, 119, 87, 0.4)" : "var(--border-subtle)"}`,
                          borderRadius: "var(--radius-pill)",
                          color: isActive ? "var(--accent-terracotta)" : "var(--text-secondary)",
                          cursor: "pointer",
                          transition: "all 0.18s var(--ease-spring)",
                        }}
                      >
                        {shillings >= 1000 ? `${shillings / 1000}K` : shillings}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => {
                      const exact = totals.grandTotalCents;
                      setCashTenderedCents(exact);
                      setRawInput((exact / 100).toFixed(0));
                    }}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      fontSize: 11,
                      fontWeight: 700,
                      backgroundColor: cashTenderedCents === totals.grandTotalCents ? "var(--accent-terracotta-bg)" : "var(--bg-surface-elevated)",
                      border: `1px solid ${cashTenderedCents === totals.grandTotalCents ? "rgba(217, 119, 87, 0.4)" : "var(--border-subtle)"}`,
                      borderRadius: "var(--radius-pill)",
                      color: cashTenderedCents === totals.grandTotalCents ? "var(--accent-terracotta)" : "var(--text-muted)",
                      cursor: "pointer",
                      transition: "all 0.18s var(--ease-spring)",
                      letterSpacing: "0.01em",
                    }}
                  >
                    Exact
                  </button>
                </div>
              </div>

              {/* Custom amount input */}
              <div>
                <label
                  htmlFor="cash-tendered-input"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: isBelowTotal ? "var(--accent-rose)" : "var(--text-muted)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: 8,
                    transition: "color 0.2s ease",
                  }}
                >
                  Cash Tendered (KES)
                </label>
                <div style={{ position: "relative" }}>
                  {/* Currency prefix */}
                  <span
                    style={{
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
                    }}
                  >
                    KES
                  </span>
                  <input
                    id="cash-tendered-input"
                    ref={customInputRef}
                    type="text"
                    inputMode="decimal"
                    value={rawInput}
                    onChange={handleCustomInputChange}
                    onBlur={handleCustomInputBlur}
                    onFocus={(e) => {
                      e.currentTarget.select();
                      e.currentTarget.style.borderColor = isBelowTotal
                        ? "var(--accent-rose)"
                        : "var(--border-focus)";
                      e.currentTarget.style.boxShadow = isBelowTotal
                        ? "0 0 0 3px rgba(224, 109, 115, 0.15)"
                        : "0 0 0 3px rgba(217, 119, 87, 0.15)";
                    }}
                    onBlurCapture={(e) => {
                      e.currentTarget.style.borderColor = isBelowTotal
                        ? "rgba(224, 109, 115, 0.5)"
                        : "var(--border-subtle)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    placeholder="Enter amount"
                    style={{
                      width: "100%",
                      height: 52,
                      padding: "0 16px 0 52px",
                      fontFamily: "var(--font-mono)",
                      fontSize: 20,
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      backgroundColor: isBelowTotal
                        ? "var(--accent-rose-bg)"
                        : "var(--bg-surface-elevated)",
                      color: isBelowTotal ? "var(--accent-rose)" : "var(--text-primary)",
                      border: `1px solid ${
                        isBelowTotal ? "rgba(224, 109, 115, 0.5)" : "var(--border-subtle)"
                      }`,
                      borderRadius: "var(--radius-md)",
                      outline: "none",
                      transition: "border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease, color 0.2s ease",
                    }}
                  />
                </div>
                {/* Inline error message — only shown when short */}
                {isBelowTotal && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      marginTop: 6,
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: "var(--accent-rose)",
                    }}
                  >
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Short by {formatCurrency(totals.grandTotalCents - cashTenderedCents)}
                  </div>
                )}
              </div>

              {/* Change breakdown card */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  padding: "14px 16px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-surface-elevated)",
                  border: `1px solid ${
                    changeDueCents > 0
                      ? "rgba(141, 161, 115, 0.3)"
                      : cashTenderedCents === 0
                      ? "var(--border-subtle)"
                      : "var(--border-subtle)"
                  }`,
                  transition: "border-color 0.2s ease",
                }}
              >
                <div>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Tendered</span>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 800, marginTop: 3, letterSpacing: "-0.02em" }}>
                    {formatCurrency(cashTenderedCents)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Change Due</span>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 18,
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                      marginTop: 3,
                      color: changeDueCents > 0
                        ? "var(--accent-sage)"
                        : changeDueCents === 0 && cashTenderedCents > 0
                        ? "var(--accent-emerald)"
                        : "var(--text-muted)",
                      transition: "color 0.2s ease",
                    }}
                  >
                    {formatCurrency(changeDueCents)}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* M-Pesa Mobile Money */}
          {(paymentMethod === "mpesa_stk" || paymentMethod === "mpesa_till") && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                Customer Safaricom Mobile Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 0712345678 or 254712345678"
                style={{
                  height: 46,
                  padding: "0 16px",
                  fontSize: 14,
                  fontFamily: "var(--font-mono)",
                  backgroundColor: "var(--bg-surface-elevated)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-pill)",
                  outline: "none",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--border-focus)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
              />
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.45 }}>
                {paymentMethod === "mpesa_stk"
                  ? "Instant Daraja STK Push will prompt customer for M-Pesa PIN on handset."
                  : "Customer enters Till 445566 from Lipa na M-Pesa menu. Reconciled in Phase 4."}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions (Pills) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 12,
            padding: "18px 24px",
            borderTop: "1px solid var(--border-subtle)",
            backgroundColor: "var(--bg-surface-subtle)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "transparent",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            disabled={paymentMethod === "cash" && !isExactOrMore}
            className="pos-btn-pill pos-btn-pill-primary"
            style={{
              padding: "10px 26px",
              backgroundColor: isSuccess ? "var(--accent-sage)" : "var(--accent-primary)",
              opacity: isExactOrMore ? 1 : 0.5,
              cursor: isExactOrMore ? "pointer" : "not-allowed",
            }}
          >
            {isSuccess ? (
              <>
                <IconCheck size={16} />
                <span>Transaction Logged</span>
              </>
            ) : (
              <span>Complete Sale</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

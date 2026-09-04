import React, { useState, useRef, useEffect } from "react";
import type { CartItem, CartTotals } from "../lib/types";
import { formatCurrency } from "../lib/cart";
import { completeCashSale, openDrawer } from "../lib/checkout";
import { IconCash, IconPhone, IconClose, IconCheck } from "./icons";

interface TenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  totals: CartTotals;
  onCompleteSale: (result: any) => void;
}

export const TenderModal: React.FC<TenderModalProps> = ({
  isOpen,
  onClose,
  items,
  totals,
  onCompleteSale,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa_stk" | "mpesa_till">("cash");
  const [cashTenderedCents, setCashTenderedCents] = useState<number>(() => totals.grandTotalCents);
  const [rawInput, setRawInput] = useState<string>(() => (totals.grandTotalCents / 100).toFixed(0));
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  // Reset tendered to total when modal opens or totals change (only if not manually edited recently)
  useEffect(() => {
    if (isOpen) {
      setCashTenderedCents(totals.grandTotalCents);
      setRawInput(totals.grandTotalCents ? (totals.grandTotalCents / 100).toFixed(0) : "");
      setErrorMsg(null);
      setIsSuccess(false);
      setLastReceipt(null);
      setIsProcessing(false);
    }
  }, [isOpen, totals.grandTotalCents]);

  if (!isOpen) return null;

  const changeDueCents = Math.max(0, cashTenderedCents - totals.grandTotalCents); // integer cents
  const isExactOrMore = cashTenderedCents >= totals.grandTotalCents;
  const isBelowTotal = cashTenderedCents > 0 && cashTenderedCents < totals.grandTotalCents;
  const isZeroItems = items.length === 0;

  const MAX_CASH_SHILLINGS = 999_999;

  const handleQuickCash = (amountShillings: number) => {
    const cents = amountShillings * 100;
    setCashTenderedCents(cents);
    setRawInput(amountShillings.toFixed(0));
    setErrorMsg(null);
    setTimeout(() => customInputRef.current?.select(), 50);
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    if (!/^\d*\.?\d{0,2}$/.test(raw)) return;
    if (/^0\d/.test(raw)) {
      raw = raw.replace(/^0+/, "") || "0";
    }
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed > MAX_CASH_SHILLINGS) return;
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

  const handleConfirm = async () => {
    if (isZeroItems) {
      setErrorMsg("Cart is empty");
      return;
    }
    if (paymentMethod === "cash" && !isExactOrMore) {
      setErrorMsg(`Short by ${formatCurrency(totals.grandTotalCents - cashTenderedCents)}`);
      return;
    }
    // mpesa still not fully wired — show message
    if (paymentMethod !== "cash") {
      setErrorMsg("M-Pesa flow not required for Phase 4 cash verification — select Cash");
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const result = await completeCashSale(items, totals, cashTenderedCents);
      setIsSuccess(true);
      setLastReceipt(result.receipt);
      // Show success for 1.1s then propagate
      setTimeout(() => {
        setIsSuccess(false);
        onCompleteSale(result);
        onClose();
      }, 1100);
    } catch (err: any) {
      setErrorMsg(err.message || String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNoSaleDrawer = async () => {
    setErrorMsg(null);
    try {
      const res = await openDrawer({ reason: "no_sale", amountCents: 0 });
      setErrorMsg(null);
      // Visual feedback via same success path? Just flash.
      console.log("[TenderModal] No-sale drawer opened:", res);
      // Brief success indicator for no_sale
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 800);
    } catch (e: any) {
      setErrorMsg(e.message);
    }
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
          maxWidth: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border-strong)",
          boxShadow: "var(--shadow-elevated)",
          overflowX: "hidden",
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
            padding: "18px 24px",
            borderBottom: "1px solid var(--border-subtle)",
            position: "sticky",
            top: 0,
            backgroundColor: "var(--bg-surface)",
            zIndex: 1,
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
              Checkout Tender — Cash First Class
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
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Total Due Banner */}
          <div
            style={{
              padding: "16px 18px",
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
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                {totals.itemCount} items · incl. VAT
              </div>
              {items.length > 0 && (
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, maxWidth: 220, lineHeight: 1.4 }}>
                  {items.map((i) => `${i.name}×${i.quantity}`).join(", ").substring(0, 80)}
                </div>
              )}
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 26,
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
                    padding: "10px 8px",
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
                  Quick Select (KES)
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
                      setErrorMsg(null);
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

              {/* Custom amount input — integer cents math display */}
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
                  Cash Tendered (KES) — integer cents math
                </label>
                <div style={{ position: "relative" }}>
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
                    placeholder="Enter amount"
                    style={{
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
                      border: `1px solid ${
                        isBelowTotal ? "rgba(224, 109, 115, 0.5)" : "var(--border-subtle)"
                      }`,
                      borderRadius: "var(--radius-md)",
                      outline: "none",
                      transition: "border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease, color 0.2s ease",
                    }}
                  />
                </div>
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
                    Short by {formatCurrency(totals.grandTotalCents - cashTenderedCents)} — integer cents: {totals.grandTotalCents - cashTenderedCents}c
                  </div>
                )}
                {/* Integer cents debug line */}
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
                  tendered={cashTenderedCents}c · total={totals.grandTotalCents}c · change={changeDueCents}c (int math)
                </div>
              </div>

              {/* Change breakdown card — integer cents display */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  padding: "12px 14px",
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
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 800, marginTop: 3, letterSpacing: "-0.02em" }}>
                    {formatCurrency(cashTenderedCents)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Change Due</span>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 16,
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

              {/* No-sale drawer button + receipt preview hint */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleNoSaleDrawer}
                  type="button"
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: "var(--bg-surface-elevated)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-secondary)",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  title="Opens drawer with reason no_sale (logged to backend)"
                >
                  No-Sale Drawer
                </button>
                <button
                  onClick={async () => {
                    try { await openDrawer({ reason: "manager_override", amountCents: 0 }); } catch(e:any){ setErrorMsg(e.message);} 
                  }}
                  type="button"
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: "var(--bg-surface-elevated)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-secondary)",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Manager Override
                </button>
              </div>

            </div>
          )}

          {/* M-Pesa placeholder */}
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
                  height: 44,
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
              <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.45 }}>
                {paymentMethod === "mpesa_stk"
                  ? "STK Push requires online — cash is primary offline method per §2.4. This verifies cash first."
                  : "Till manual flow — customer enters Till, cashier records code. Cash is primary."}
              </div>
            </div>
          )}

          {/* Error / success banner */}
          {errorMsg && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--accent-rose-bg)",
                border: "1px solid rgba(224,109,115,0.35)",
                color: "var(--accent-rose)",
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              {errorMsg}
            </div>
          )}
          {isSuccess && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "rgba(141,161,115,0.15)",
                border: "1px solid rgba(141,161,115,0.35)",
                color: "var(--accent-sage)",
                fontSize: 12,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <IconCheck size={16} /> {lastReceipt?.printerType === "virtual" ? "Sale completed — receipt queued (virtual printer)" : "Sale completed — receipt printed & drawer kicked"}
            </div>
          )}
          {lastReceipt && lastReceipt.textPreview && (
            <details style={{ fontSize: 11, color: "var(--text-muted)" }}>
              <summary style={{ cursor: "pointer", fontWeight: 600 }}>Last ESC/POS receipt preview (real tx data)</summary>
              <pre style={{ whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)", fontSize: 10, backgroundColor: "var(--bg-surface-elevated)", padding: 12, borderRadius: 8, marginTop: 8, maxHeight: 240, overflowY: "auto", border: "1px solid var(--border-subtle)" }}>
                {lastReceipt.textPreview || lastReceipt.virtualParsed || "—"}
              </pre>
              <div style={{ fontSize: 10, marginTop: 4, fontFamily: "var(--font-mono)" }}>
                bytes={lastReceipt.bytesLength} hex={ (lastReceipt.hexPreview||"").substring(0,80)}... printer={lastReceipt.printerType}
              </div>
            </details>
          )}
        </div>

        {/* Modal Footer Actions (Pills) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 12,
            padding: "14px 20px",
            borderTop: "1px solid var(--border-subtle)",
            backgroundColor: "var(--bg-surface-subtle)",
          }}
        >
          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{
              padding: "10px 20px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "transparent",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 600,
              cursor: isProcessing ? "not-allowed" : "pointer",
              opacity: isProcessing ? 0.6 : 1,
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            disabled={isProcessing || (paymentMethod === "cash" && !isExactOrMore) || isZeroItems}
            className="pos-btn-pill pos-btn-pill-primary"
            style={{
              padding: "10px 24px",
              backgroundColor: isSuccess ? "var(--accent-sage)" : "var(--accent-primary)",
              opacity: (isProcessing || (paymentMethod === "cash" && !isExactOrMore) || isZeroItems) ? 0.5 : 1,
              cursor: (isProcessing || (paymentMethod === "cash" && !isExactOrMore) || isZeroItems) ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {isSuccess ? (
              <>
                <IconCheck size={16} />
                <span>{lastReceipt ? "Done" : "Transaction Logged"}</span>
              </>
            ) : isProcessing ? (
              <span>Processing…</span>
            ) : (
              <span>Complete Sale — Cash</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

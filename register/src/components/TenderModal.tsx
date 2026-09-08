import React, { useState, useRef, useEffect } from "react";
import type { CartItem, CartTotals } from "../lib/types";
import { formatCurrency } from "../lib/cart";
import {
  completeCashSale,
  initiateMpesaStkSale,
  completeMpesaTillSale,
  pollPaymentStatus,
  openDrawer,
} from "../lib/checkout";
import { IconCash, IconPhone, IconClose, IconCheck, IconSync } from "./icons";

interface TenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  totals: CartTotals;
  onCompleteSale: (result: any) => void;
}

const TILL_NUMBER = "3636288";

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
  
  // M-Pesa STK Push state
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [stkPending, setStkPending] = useState<boolean>(false);
  const [stkCountdown, setStkCountdown] = useState<number>(60);
  const [stkStatusText, setStkStatusText] = useState<string>("Waiting for customer PIN...");
  const pollAbortRef = useRef<boolean>(false);
  const countdownTimerRef = useRef<any>(null);

  // M-Pesa Till state
  const [mpesaTillCode, setMpesaTillCode] = useState<string>("");

  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  // Frozen copy of the sale at the moment payment succeeds. The receipt,
  // totals banner and Done state must render from this — never from the
  // live cart props, which are cleared when the sale finalizes.
  const [saleSnapshot, setSaleSnapshot] = useState<{
    items: CartItem[];
    totals: CartTotals;
    paymentMethod: "cash" | "mpesa_stk" | "mpesa_till";
    cashTenderedCents: number;
    changeDueCents: number;
    phoneNumber: string;
    tillCode: string;
  } | null>(null);
  const customInputRef = useRef<HTMLInputElement>(null);
  const wasOpenRef = useRef(false);

  // Reset only on the closed → open transition. Must NOT depend on
  // totals.grandTotalCents: the parent clears the cart after a successful
  // sale, and re-running this reset would wipe isSuccess + receipt and
  // leave the modal looking like a fresh empty tender.
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setPaymentMethod("cash");
      setCashTenderedCents(totals.grandTotalCents);
      setRawInput(totals.grandTotalCents ? (totals.grandTotalCents / 100).toFixed(0) : "");
      setErrorMsg(null);
      setIsSuccess(false);
      setLastReceipt(null);
      setSaleSnapshot(null);
      setIsProcessing(false);
      setStkPending(false);
      setStkCountdown(60);
      setStkStatusText("Waiting for customer PIN...");
      setPhoneNumber("");
      setMpesaTillCode("");
      pollAbortRef.current = false;
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  // Clean up countdown on unmount
  useEffect(() => {
    return () => {
      pollAbortRef.current = true;
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  // After success, freeze the UI on the snapshot so clearing the live cart
  // cannot turn the receipt back into an empty "0 items / KES 0.00" tender.
  const displayItems = isSuccess && saleSnapshot ? saleSnapshot.items : items;
  const displayTotals = isSuccess && saleSnapshot ? saleSnapshot.totals : totals;
  const displayCashTendered =
    isSuccess && saleSnapshot ? saleSnapshot.cashTenderedCents : cashTenderedCents;
  const displayPhone = isSuccess && saleSnapshot ? saleSnapshot.phoneNumber : phoneNumber;
  const displayTillCode = isSuccess && saleSnapshot ? saleSnapshot.tillCode : mpesaTillCode;
  const displayMethod = isSuccess && saleSnapshot ? saleSnapshot.paymentMethod : paymentMethod;

  const changeDueCents = Math.max(0, displayCashTendered - displayTotals.grandTotalCents);
  const isExactOrMore = displayCashTendered >= displayTotals.grandTotalCents;
  const isBelowTotal =
    displayCashTendered > 0 && displayCashTendered < displayTotals.grandTotalCents;
  const isZeroItems = displayItems.length === 0;
  const inputsLocked = isSuccess || stkPending || isProcessing;

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
      setSaleSnapshot({
        items: [...items],
        totals: { ...totals },
        paymentMethod: "cash",
        cashTenderedCents,
        changeDueCents: Math.max(0, cashTenderedCents - totals.grandTotalCents),
        phoneNumber: "",
        tillCode: "",
      });
      setIsSuccess(true);
      setLastReceipt(result);
      onCompleteSale(result);
    } catch (err: any) {
      setErrorMsg(err.message || String(err));
    } finally {
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
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
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
      const pollResult = await pollPaymentStatus(
        paymentId,
        (status) => {
          if (status === "pending") {
            setStkStatusText("Waiting for customer PIN entry...");
          }
        },
        60000
      );

      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

      if (pollAbortRef.current) {
        setStkPending(false);
        setIsProcessing(false);
        return;
      }

      if (pollResult.status === "captured") {
        setStkPending(false);
        setSaleSnapshot({
          items: [...items],
          totals: { ...totals },
          paymentMethod: "mpesa_stk",
          cashTenderedCents: totals.grandTotalCents,
          changeDueCents: 0,
          phoneNumber,
          tillCode: "",
        });
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
      } else if (pollResult.status === "failed") {
        setStkPending(false);
        setErrorMsg("Customer cancelled or payment failed on phone");
      } else {
        setStkPending(false);
        setErrorMsg("STK prompt timed out. Ask customer to pay via Buy Goods Till 3636288 or retry");
      }
    } catch (err: any) {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      setStkPending(false);
      setErrorMsg(err.message || "Failed to initiate M-Pesa STK Push");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelStk = () => {
    pollAbortRef.current = true;
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
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
      setSaleSnapshot({
        items: [...items],
        totals: { ...totals },
        paymentMethod: "mpesa_till",
        cashTenderedCents: totals.grandTotalCents,
        changeDueCents: 0,
        phoneNumber: "",
        tillCode: code,
      });
      setIsSuccess(true);
      setLastReceipt(result);
      onCompleteSale(result);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to record Till payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNoSaleDrawer = async () => {
    setErrorMsg(null);
    try {
      await openDrawer({ reason: "no_sale", amountCents: 0 });
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
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(2px)",
        padding: 16,
      }}
      onClick={() => {
        if (!stkPending && !isProcessing) onClose();
      }}
    >
      <div
        style={{
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
              Checkout Tender
            </span>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>
              Payment Processing
            </h3>
          </div>

          <button
            onClick={onClose}
            disabled={stkPending || isProcessing}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: stkPending || isProcessing ? "not-allowed" : "pointer",
              padding: 6,
              borderRadius: "var(--radius-pill)",
              display: "flex",
              alignItems: "center",
              opacity: stkPending || isProcessing ? 0.4 : 1,
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
                {displayTotals.itemCount} items · incl. VAT
              </div>
              {displayItems.length > 0 && (
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, maxWidth: 220, lineHeight: 1.4 }}>
                  {displayItems.map((i) => `${i.name} x ${i.quantity}`).join(", ").substring(0, 80)}
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
              {formatCurrency(displayTotals.grandTotalCents)}
            </span>
          </div>

          {/* Payment Method Selector (Pills) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { id: "cash", label: "Cash", icon: <IconCash size={16} /> },
              { id: "mpesa_stk", label: "M-Pesa STK", icon: <IconPhone size={16} /> },
              { id: "mpesa_till", label: `Till ${TILL_NUMBER}`, icon: <IconPhone size={16} /> },
            ].map((method) => {
              const active = displayMethod === method.id;
              return (
                <button
                  key={method.id}
                  disabled={inputsLocked}
                  onClick={() => {
                    if (isSuccess) return;
                    setPaymentMethod(method.id as any);
                    setErrorMsg(null);
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    padding: "10px 8px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: active ? "var(--accent-primary)" : "var(--bg-surface-elevated)",
                    color: active ? "var(--accent-primary-text)" : "var(--text-secondary)",
                    border: `1px solid ${active ? "transparent" : "var(--border-subtle)"}`,
                    cursor: inputsLocked ? "not-allowed" : "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    boxShadow: "none",
                    transition: "all 0.18s var(--ease-spring)",
                    opacity: inputsLocked ? 0.6 : 1,
                  }}
                >
                  {method.icon}
                  {method.label}
                </button>
              );
            })}
          </div>

          {/* 1. CASH TAB */}
          {displayMethod === "cash" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Quick denomination chips */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                  Quick Select (KES)
                </label>
                <div style={{ display: "flex", gap: 6 }}>
                  {[500, 1000, 2000, 5000].map((shillings) => {
                    const isActive = displayCashTendered === shillings * 100;
                    return (
                      <button
                        key={shillings}
                        onClick={() => handleQuickCash(shillings)}
                        disabled={isSuccess}
                        style={{
                          flex: 1,
                          padding: "8px 0",
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                          fontWeight: 700,
                          backgroundColor: isActive ? "var(--accent-primary-bg)" : "var(--bg-surface-elevated)",
                          border: `1px solid ${isActive ? "var(--accent-primary-border)" : "var(--border-subtle)"}`,
                          borderRadius: "var(--radius-md)",
                          color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                          cursor: isSuccess ? "not-allowed" : "pointer",
                          opacity: isSuccess ? 0.6 : 1,
                          transition: "all 0.18s var(--ease-spring)",
                        }}
                      >
                        {shillings >= 1000 ? `${shillings / 1000}K` : shillings}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => {
                      if (isSuccess) return;
                      const exact = totals.grandTotalCents;
                      setCashTenderedCents(exact);
                      setRawInput((exact / 100).toFixed(0));
                      setErrorMsg(null);
                    }}
                    disabled={isSuccess}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      fontSize: 11,
                      fontWeight: 700,
                      backgroundColor: displayCashTendered === displayTotals.grandTotalCents ? "var(--accent-primary-bg)" : "var(--bg-surface-elevated)",
                      border: `1px solid ${displayCashTendered === displayTotals.grandTotalCents ? "var(--accent-primary-border)" : "var(--border-subtle)"}`,
                      borderRadius: "var(--radius-md)",
                      color: displayCashTendered === displayTotals.grandTotalCents ? "var(--accent-primary)" : "var(--text-muted)",
                      cursor: isSuccess ? "not-allowed" : "pointer",
                      opacity: isSuccess ? 0.6 : 1,
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
                    value={isSuccess ? (displayCashTendered / 100).toFixed(0) : rawInput}
                    onChange={handleCustomInputChange}
                    onBlur={handleCustomInputBlur}
                    disabled={isSuccess}
                    onFocus={(e) => {
                      e.currentTarget.select();
                      e.currentTarget.style.borderColor = isBelowTotal
                        ? "var(--accent-rose)"
                        : "var(--border-focus)";
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
                        isBelowTotal ? "var(--accent-rose-border)" : "var(--border-subtle)"
                      }`,
                      borderRadius: "var(--radius-md)",
                      outline: "none",
                    }}
                  />
                </div>
                {isBelowTotal && !isSuccess && (
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
                    Short by {formatCurrency(displayTotals.grandTotalCents - displayCashTendered)}
                  </div>
                )}
              </div>

              {/* Change breakdown */}
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
                      ? "var(--accent-sage-border)"
                      : "var(--border-subtle)"
                  }`,
                }}
              >
                <div>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Tendered</span>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 800, marginTop: 3 }}>
                    {formatCurrency(displayCashTendered)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Change Due</span>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 16,
                      fontWeight: 800,
                      marginTop: 3,
                      color: changeDueCents > 0 ? "var(--accent-sage)" : "var(--text-muted)",
                    }}
                  >
                    {formatCurrency(changeDueCents)}
                  </div>
                </div>
              </div>

              {/* Drawer buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleNoSaleDrawer}
                  type="button"
                  disabled={isSuccess}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: "var(--bg-surface-elevated)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-secondary)",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: isSuccess ? "not-allowed" : "pointer",
                    opacity: isSuccess ? 0.5 : 1,
                  }}
                >
                  No-Sale Drawer
                </button>
                <button
                  onClick={async () => {
                    if (isSuccess) return;
                    try {
                      await openDrawer({ reason: "manager_override", amountCents: 0 });
                    } catch (e: any) {
                      setErrorMsg(e.message);
                    }
                  }}
                  type="button"
                  disabled={isSuccess}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: "var(--bg-surface-elevated)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-secondary)",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: isSuccess ? "not-allowed" : "pointer",
                    opacity: isSuccess ? 0.5 : 1,
                  }}
                >
                  Manager Override
                </button>
              </div>
            </div>
          )}

          {/* 2. M-PESA STK PUSH TAB */}
          {displayMethod === "mpesa_stk" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {!stkPending && !isSuccess ? (
                <>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                      Customer Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. 0712345678 or 254712345678"
                      disabled={isProcessing}
                      style={{
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
                      }}
                    />
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.45 }}>
                      Customer will receive an instant prompt on their phone to enter their M-Pesa PIN for {formatCurrency(displayTotals.grandTotalCents)}.
                    </div>
                  </div>
                </>
              ) : stkPending ? (
                /* STK Waiting Card */
                <div
                  style={{
                    padding: 20,
                    borderRadius: "var(--radius-lg)",
                    backgroundColor: "var(--bg-surface-elevated)",
                    border: "1px solid var(--border-strong)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      backgroundColor: "var(--accent-primary-bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--accent-primary)",
                      animation: "spin 2s linear infinite",
                    }}
                  >
                    <IconSync size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                      {stkStatusText}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
                      Phone: {displayPhone} · Amount: {formatCurrency(displayTotals.grandTotalCents)}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      color: stkCountdown < 10 ? "var(--accent-rose)" : "var(--accent-primary)",
                      padding: "4px 12px",
                      borderRadius: "var(--radius-pill)",
                      backgroundColor: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    Timeout in {stkCountdown}s
                  </div>
                  <button
                    onClick={handleCancelStk}
                    style={{
                      marginTop: 6,
                      padding: "6px 16px",
                      borderRadius: "var(--radius-pill)",
                      backgroundColor: "transparent",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--accent-rose)",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel STK Push
                  </button>
                </div>
              ) : (
                /* Locked paid summary — receipt below carries the detail */
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--bg-surface-elevated)",
                    border: "1px solid var(--border-subtle)",
                    fontSize: 12,
                    color: "var(--text-secondary)",
                  }}
                >
                  M-Pesa STK paid · {displayPhone} · {formatCurrency(displayTotals.grandTotalCents)}
                </div>
              )}
            </div>
          )}

          {/* 3. M-PESA BUY GOODS TILL TAB */}
          {displayMethod === "mpesa_till" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Prominent Till Badge */}
              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: "var(--radius-lg)",
                  backgroundColor: "var(--accent-primary-bg)",
                  border: "1px solid var(--accent-primary-border)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent-primary)" }}>
                  Lipa na M-Pesa Buy Goods Till
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 32, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "0.04em" }}>
                  {TILL_NUMBER}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  Instruct customer to pay {formatCurrency(displayTotals.grandTotalCents)} to Till {TILL_NUMBER}
                </span>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                  M-Pesa Transaction Code
                </label>
                <input
                  type="text"
                  value={displayTillCode}
                  onChange={(e) => { if (!isSuccess) setMpesaTillCode(e.target.value.toUpperCase()); }}
                  placeholder="e.g. QHN7ACKQOP"
                  maxLength={14}
                  disabled={isSuccess}
                  style={{
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
                  }}
                />
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.45 }}>
                  Enter the confirmation code from customer SMS or merchant till statement. Use this manual method if STK push or network is unavailable.
                </div>
              </div>
            </div>
          )}

          {/* Error Feedback */}
          {errorMsg && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--accent-rose-bg)",
                border: "1px solid var(--accent-rose-border)",
                color: "var(--accent-rose)",
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* ─── On-Screen Digital Receipt ─────────────────────────────── */}
          {isSuccess && (
            <div
              style={{
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--accent-sage-border)",
                backgroundColor: "var(--bg-surface-elevated)",
                overflow: "hidden",
              }}
            >
              {/* Receipt Header */}
              <div
                style={{
                  backgroundColor: "var(--accent-sage)",
                  color: "var(--bg-app)",
                  textAlign: "center",
                  padding: "14px 16px 12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginBottom: 2 }}>
                  <IconCheck size={16} />
                  <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: "0.01em" }}>Sale Complete</span>
                </div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>
                  {new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi", dateStyle: "medium", timeStyle: "short" })}
                </div>
              </div>

              {/* Line Items */}
              <div style={{ padding: "12px 16px", borderBottom: "1px dashed var(--border-subtle)" }}>
                {displayItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: 8,
                      fontSize: 12,
                      padding: "3px 0",
                    }}
                  >
                    <span style={{ flex: 1, color: "var(--text-primary)", fontWeight: 500 }}>
                      {item.name}
                      {item.quantity > 1 && (
                        <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> x{item.quantity}</span>
                      )}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-primary)", fontWeight: 600 }}>
                      {formatCurrency(item.lineTotalCents)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ padding: "10px 16px", borderBottom: "1px dashed var(--border-subtle)", display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
                  <span>Subtotal</span>
                  <span style={{ fontFamily: "var(--font-mono)" }}>{formatCurrency(displayTotals.subtotalCents)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
                  <span>VAT</span>
                  <span style={{ fontFamily: "var(--font-mono)" }}>{formatCurrency(displayTotals.totalTaxCents)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800, color: "var(--text-primary)", marginTop: 2 }}>
                  <span>Total</span>
                  <span style={{ fontFamily: "var(--font-mono)" }}>{formatCurrency(displayTotals.grandTotalCents)}</span>
                </div>
              </div>

              {/* Payment Row */}
              <div style={{ padding: "10px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
                {displayMethod === "cash" && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-secondary)" }}>
                      <span>Cash Tendered</span>
                      <span style={{ fontFamily: "var(--font-mono)" }}>{formatCurrency(displayCashTendered)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "var(--accent-sage)" }}>
                      <span>Change Due</span>
                      <span style={{ fontFamily: "var(--font-mono)" }}>{formatCurrency(changeDueCents)}</span>
                    </div>
                  </>
                )}
                {displayMethod === "mpesa_stk" && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-secondary)" }}>
                    <span>M-Pesa STK — {displayPhone}</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-sage)", fontWeight: 700 }}>{formatCurrency(displayTotals.grandTotalCents)}</span>
                  </div>
                )}
                {displayMethod === "mpesa_till" && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-secondary)" }}>
                      <span>M-Pesa Till {TILL_NUMBER}</span>
                      <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-sage)", fontWeight: 700 }}>{formatCurrency(displayTotals.grandTotalCents)}</span>
                    </div>
                    {displayTillCode && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                        Ref: {displayTillCode}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
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
            disabled={stkPending || isProcessing}
            style={{
              padding: "10px 20px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "transparent",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 600,
              cursor: stkPending || isProcessing ? "not-allowed" : "pointer",
              opacity: stkPending || isProcessing ? 0.6 : 1,
            }}
          >
            Cancel
          </button>

          {displayMethod === "cash" && (
            <button
              onClick={isSuccess ? onClose : handleCashConfirm}
              disabled={isProcessing || (!isSuccess && (!isExactOrMore || isZeroItems))}
              className="pos-btn-pill pos-btn-pill-primary"
              style={{
                padding: "10px 24px",
                backgroundColor: isSuccess ? "var(--accent-sage)" : "var(--accent-primary)",
                opacity: (isProcessing || (!isSuccess && (!isExactOrMore || isZeroItems))) ? 0.5 : 1,
                cursor: (isProcessing || (!isSuccess && (!isExactOrMore || isZeroItems))) ? "not-allowed" : "pointer",
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
                  <span>Done</span>
                </>
              ) : isProcessing ? (
                <span>Processing...</span>
              ) : (
                <span>Complete Sale (Cash)</span>
              )}
            </button>
          )}

          {displayMethod === "mpesa_stk" && !stkPending && (
            <button
              onClick={isSuccess ? onClose : handleStkInitiate}
              disabled={isProcessing || (!isSuccess && (isZeroItems || !phoneNumber.trim()))}
              className="pos-btn-pill pos-btn-pill-primary"
              style={{
                padding: "10px 24px",
                backgroundColor: isSuccess ? "var(--accent-sage)" : "var(--accent-primary)",
                opacity: (isProcessing || (!isSuccess && (isZeroItems || !phoneNumber.trim()))) ? 0.5 : 1,
                cursor: (isProcessing || (!isSuccess && (isZeroItems || !phoneNumber.trim()))) ? "not-allowed" : "pointer",
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
                  <span>Done</span>
                </>
              ) : isProcessing ? <span>Sending...</span> : <span>Send STK Push</span>}
            </button>
          )}

          {displayMethod === "mpesa_till" && (
            <button
              onClick={isSuccess ? onClose : handleTillConfirm}
              disabled={isProcessing || (!isSuccess && (isZeroItems || mpesaTillCode.trim().length < 8))}
              className="pos-btn-pill pos-btn-pill-primary"
              style={{
                padding: "10px 24px",
                backgroundColor: isSuccess ? "var(--accent-sage)" : "var(--accent-primary)",
                opacity: (isProcessing || (!isSuccess && (isZeroItems || mpesaTillCode.trim().length < 8))) ? 0.5 : 1,
                cursor: (isProcessing || (!isSuccess && (isZeroItems || mpesaTillCode.trim().length < 8))) ? "not-allowed" : "pointer",
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
                  <span>Done</span>
                </>
              ) : isProcessing ? (
                <span>Recording...</span>
              ) : (
                <span>Confirm Till Payment</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

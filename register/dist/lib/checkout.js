import { apiFetch } from "./api";
const DEFAULT_LOCATION_ID = "11111111-1111-1111-8111-111111111111"; // Main Store - Nairobi CBD
const DEFAULT_REGISTER_ID = "22222222-2222-2222-8222-222222222222"; // POS Terminal 1
const DEFAULT_CASHIER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"; // admin
export function buildCashSalePayload(items, totals, amountTenderedCents, opts = {}) {
    // Integer cents verification: totals already integer, recalc guard
    const id = crypto.randomUUID();
    // Guard: amountTendered must be integer
    if (!Number.isInteger(amountTenderedCents)) {
        throw new Error("amountTenderedCents must be integer cents");
    }
    if (amountTenderedCents < totals.grandTotalCents) {
        throw new Error(`Insufficient tendered: ${amountTenderedCents} < ${totals.grandTotalCents}`);
    }
    let activeCashierId = opts.cashierId;
    if (!activeCashierId && typeof window !== "undefined") {
        try {
            const savedUser = localStorage.getItem("pos-user");
            if (savedUser) {
                const u = JSON.parse(savedUser);
                if (u && u.id)
                    activeCashierId = u.id;
            }
        }
        catch { }
    }
    return {
        id,
        locationId: opts.locationId || DEFAULT_LOCATION_ID,
        registerId: opts.registerId || DEFAULT_REGISTER_ID,
        cashierId: activeCashierId || DEFAULT_CASHIER_ID,
        subtotalCents: totals.subtotalCents,
        taxCents: totals.totalTaxCents,
        totalCents: totals.grandTotalCents,
        lineItems: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPriceCents: item.priceCents,
            taxRateBp: item.taxRateBp,
            discountCents: 0,
            lineTotalCents: item.lineTotalCents,
        })),
        amountTenderedCents,
        createdAt: new Date().toISOString(),
    };
}
export async function completeCashSale(items, totals, amountTenderedCents) {
    const payload = buildCashSalePayload(items, totals, amountTenderedCents);
    // Try Electron IPC first
    if (typeof window !== "undefined" && window.posApi?.completeCashSale) {
        const result = await window.posApi.completeCashSale(payload);
        return {
            success: result.success ?? true,
            offline: result.offline ?? false,
            queued: result.queued,
            changeDueCents: result.changeDueCents ?? amountTenderedCents - totals.grandTotalCents,
            transactionId: result.transaction?.id || result.transactionId || payload.id,
            receipt: result.receipt,
            drawerKick: result.drawerKick,
            transaction: result.transaction,
            payment: result.payment,
            drawerEvent: result.drawerEvent,
            error: result.error,
        };
    }
    // Browser dev fallback: direct fetch to backend checkout (with failover)
    const res = await apiFetch("/checkout/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        errorPrefix: "Checkout failed",
    });
    const data = await res.json();
    return {
        success: true,
        offline: false,
        changeDueCents: data.changeDueCents,
        transactionId: data.transaction.id,
        receipt: data.receipt,
        drawerKick: null,
        transaction: data.transaction,
        payment: data.payment,
        drawerEvent: data.drawerEvent,
    };
}
export async function initiateMpesaStkSale(items, totals, phoneNumber, opts = {}) {
    const payload = {
        id: crypto.randomUUID(),
        locationId: opts.locationId || DEFAULT_LOCATION_ID,
        registerId: opts.registerId || DEFAULT_REGISTER_ID,
        cashierId: opts.cashierId || DEFAULT_CASHIER_ID,
        subtotalCents: totals.subtotalCents,
        taxCents: totals.totalTaxCents,
        totalCents: totals.grandTotalCents,
        lineItems: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPriceCents: item.priceCents,
            taxRateBp: item.taxRateBp,
            discountCents: 0,
            lineTotalCents: item.lineTotalCents,
        })),
        phoneNumber,
        createdAt: new Date().toISOString(),
    };
    const res = await apiFetch("/checkout/mpesa-stk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        errorPrefix: "M-Pesa STK failed",
    });
    const data = await res.json();
    return {
        success: true,
        transaction: data.transaction,
        payment: data.payment,
        darajaResponse: data.darajaResponse,
    };
}
export async function completeMpesaTillSale(items, totals, mpesaCode, opts = {}) {
    const payload = {
        id: crypto.randomUUID(),
        locationId: opts.locationId || DEFAULT_LOCATION_ID,
        registerId: opts.registerId || DEFAULT_REGISTER_ID,
        cashierId: opts.cashierId || DEFAULT_CASHIER_ID,
        subtotalCents: totals.subtotalCents,
        taxCents: totals.totalTaxCents,
        totalCents: totals.grandTotalCents,
        lineItems: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPriceCents: item.priceCents,
            taxRateBp: item.taxRateBp,
            discountCents: 0,
            lineTotalCents: item.lineTotalCents,
        })),
        mpesaCode: mpesaCode.trim().toUpperCase(),
        createdAt: new Date().toISOString(),
    };
    const res = await apiFetch("/checkout/mpesa-till", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        errorPrefix: "M-Pesa Till failed",
    });
    const data = await res.json();
    return {
        success: true,
        transaction: data.transaction,
        payment: data.payment,
        receipt: data.receipt,
    };
}
export async function pollPaymentStatus(paymentId, onStatus, timeoutMs = 60000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const res = await apiFetch(`/payments/status/${paymentId}`, { timeoutMs: 5000 });
            if (res.ok) {
                const payment = await res.json();
                if (onStatus)
                    onStatus(payment.status);
                if (payment.status === 'captured') {
                    // Fetch final receipt
                    let receipt = null;
                    try {
                        const compRes = await apiFetch(`/checkout/mpesa-complete/${payment.id}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                        });
                        if (compRes.ok) {
                            const compData = await compRes.json();
                            receipt = compData.receipt;
                        }
                    }
                    catch { }
                    return { status: 'captured', payment, receipt };
                }
                if (payment.status === 'failed') {
                    return { status: 'failed', payment };
                }
            }
        }
        catch { }
        // Wait 2.5s between polls
        await new Promise((resolve) => setTimeout(resolve, 2500));
    }
    return { status: 'pending', payment: null };
}
export async function openDrawer(args) {
    if (typeof window !== "undefined" && window.posApi?.openDrawer) {
        return window.posApi.openDrawer(args);
    }
    const res = await apiFetch("/checkout/drawer/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
        errorPrefix: "Drawer open failed",
    });
    return res.json();
}

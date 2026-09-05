import type { CartItem, CartTotals } from "./types";

// Checkout service — builds CashSale payload with integer cents math, calls backend via window.posApi or direct fetch
// Handles offline queuing: Electron main handles queuing, so this is just a thin wrapper

export interface CashSalePayload {
  id: string;
  locationId: string;
  registerId?: string;
  cashierId?: string;
  customerId?: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  lineItems: Array<{
    productId: string;
    name?: string;
    quantity: number;
    unitPriceCents: number;
    taxRateBp: number;
    discountCents: number;
    lineTotalCents: number;
  }>;
  amountTenderedCents: number;
  createdAt: string;
}

const DEFAULT_LOCATION_ID = "11111111-1111-1111-8111-111111111111"; // Main Store - Nairobi CBD
const DEFAULT_REGISTER_ID = "22222222-2222-2222-8222-222222222222"; // POS Terminal 1
const DEFAULT_CASHIER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"; // admin

export function buildCashSalePayload(
  items: CartItem[],
  totals: CartTotals,
  amountTenderedCents: number,
  opts: { locationId?: string; cashierId?: string; registerId?: string } = {}
): CashSalePayload {
  // Integer cents verification: totals already integer, recalc guard
  const id = crypto.randomUUID();

  // Guard: amountTendered must be integer
  if (!Number.isInteger(amountTenderedCents)) {
    throw new Error("amountTenderedCents must be integer cents");
  }
  if (amountTenderedCents < totals.grandTotalCents) {
    throw new Error(`Insufficient tendered: ${amountTenderedCents} < ${totals.grandTotalCents}`);
  }

  return {
    id,
    locationId: opts.locationId || DEFAULT_LOCATION_ID,
    registerId: opts.registerId || DEFAULT_REGISTER_ID,
    cashierId: opts.cashierId || DEFAULT_CASHIER_ID,
    subtotalCents: totals.subtotalCents,
    taxCents: totals.totalTaxCents,
    totalCents: totals.grandTotalCents,
    lineItems: items.map((item) => ({
      productId: item.productId,
      name: item.name,
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

export async function completeCashSale(
  items: CartItem[],
  totals: CartTotals,
  amountTenderedCents: number
): Promise<{
  success: boolean;
  offline: boolean;
  queued?: boolean;
  changeDueCents: number;
  transactionId: string;
  receipt?: any;
  drawerKick?: any;
  transaction?: any;
  payment?: any;
  drawerEvent?: any;
  error?: string;
}> {
  const payload = buildCashSalePayload(items, totals, amountTenderedCents);

  // Try Electron IPC first
  if (typeof window !== "undefined" && (window as any).posApi?.completeCashSale) {
    const result = await (window as any).posApi.completeCashSale(payload);
    // Normalize shape: checkout-queue returns offline flag
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

  // Browser dev fallback: direct fetch to backend checkout
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  const res = await fetch(`${apiUrl}/checkout/cash`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Checkout failed ${res.status}: ${body}`);
  }
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

export async function openDrawer(args: { reason: string; registerId?: string; userId?: string; amountCents?: number }) {
  if (typeof window !== "undefined" && (window as any).posApi?.openDrawer) {
    return (window as any).posApi.openDrawer(args);
  }
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  const res = await fetch(`${apiUrl}/checkout/drawer/open`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`Drawer open failed ${res.status}`);
  return res.json();
}

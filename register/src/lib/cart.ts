import type { CachedProduct, CartItem, CartTotals, TaxGroupSummary } from "./types";

export function createCartItem(
  product: CachedProduct,
  quantity: number = 1
): CartItem {
  const taxRateBp = product.tax_category_rate_bp ?? 0;
  const lineSubtotalCents = Math.round(product.price_cents * quantity);
  const lineTaxCents = Math.round((lineSubtotalCents * taxRateBp) / 10000);
  const lineTotalCents = lineSubtotalCents + lineTaxCents;

  return {
    id: `${product.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    productId: product.id,
    sku: product.sku,
    barcode: product.barcode,
    name: product.name,
    priceCents: product.price_cents,
    quantity,
    unitType: product.unit_type || "each",
    isWeighed: Boolean(product.is_weighed),
    taxCategoryId: product.tax_category_id,
    taxCategoryName: product.tax_category_name || (taxRateBp > 0 ? "Standard VAT" : "Zero Rated"),
    taxRateBp,
    lineSubtotalCents,
    lineTaxCents,
    lineTotalCents,
  };
}

export function updateItemQuantity(item: CartItem, newQty: number): CartItem {
  const quantity = Math.max(item.isWeighed ? 0.05 : 1, newQty);
  const lineSubtotalCents = Math.round(item.priceCents * quantity);
  const lineTaxCents = Math.round((lineSubtotalCents * item.taxRateBp) / 10000);
  const lineTotalCents = lineSubtotalCents + lineTaxCents;

  return {
    ...item,
    quantity,
    lineSubtotalCents,
    lineTaxCents,
    lineTotalCents,
  };
}

export function calculateCartTotals(items: CartItem[]): CartTotals {
  let subtotalCents = 0;
  let totalTaxCents = 0;
  let itemCount = 0;

  const taxGroupMap = new Map<string, TaxGroupSummary>();

  for (const item of items) {
    subtotalCents += item.lineSubtotalCents;
    totalTaxCents += item.lineTaxCents;
    itemCount += item.isWeighed ? 1 : item.quantity;

    const groupKey = item.taxCategoryId || `rate-${item.taxRateBp}`;
    const existing = taxGroupMap.get(groupKey);

    if (existing) {
      existing.taxableAmountCents += item.lineSubtotalCents;
      existing.taxCents += item.lineTaxCents;
    } else {
      taxGroupMap.set(groupKey, {
        taxCategoryId: item.taxCategoryId || groupKey,
        name: item.taxCategoryName,
        rateBp: item.taxRateBp,
        taxableAmountCents: item.lineSubtotalCents,
        taxCents: item.lineTaxCents,
      });
    }
  }

  return {
    itemCount,
    subtotalCents,
    totalTaxCents,
    grandTotalCents: subtotalCents + totalTaxCents,
    taxGroups: Array.from(taxGroupMap.values()),
  };
}

export function formatCurrency(cents: number): string {
  const shillings = (cents / 100).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `KES ${shillings}`;
}

export function formatTaxRate(rateBp: number): string {
  const pct = rateBp / 100;
  return `${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(2)}%`;
}

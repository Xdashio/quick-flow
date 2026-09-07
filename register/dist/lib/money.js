// Money as integer cents (blueprint pitfall: never float) — all calc in cents/basis points
export function formatKES(cents) {
    const sign = cents < 0 ? "-" : "";
    const abs = Math.abs(cents);
    const shillings = Math.floor(abs / 100);
    const centPart = abs % 100;
    // KES 1,234.00 with comma grouping
    return `${sign}KES ${shillings.toLocaleString("en-KE")}.${String(centPart).padStart(2, "0")}`;
}
export function formatKESCompact(cents) {
    return formatKES(cents);
}
// Tax per line: Math.round(price_cents * qty * rate_bp / 10000)
// Uses rate_bp from tax_categories (e.g. 1600 = 16%)
// qty is numeric (supports weighed items 1.5 kg etc) -> price * qty must be integer cents before tax calc
export function calcTaxCents(unitPriceCents, quantity, rateBp) {
    const lineSubtotal = Math.round(unitPriceCents * quantity);
    return Math.round((lineSubtotal * rateBp) / 10000);
}
export function calcLineTotalCents(unitPriceCents, quantity, rateBp, discountCents = 0) {
    const subtotal = Math.round(unitPriceCents * quantity);
    const tax = calcTaxCents(unitPriceCents, quantity, rateBp);
    return subtotal + tax - discountCents;
}
export function cartTotals(lines) {
    let subtotalCents = 0;
    let taxCents = 0;
    let discountCents = 0;
    for (const l of lines) {
        const lineSub = Math.round(l.priceCents * l.quantity);
        const lineTax = calcTaxCents(l.priceCents, l.quantity, l.taxRateBp);
        subtotalCents += lineSub;
        taxCents += lineTax;
        discountCents += l.discountCents;
    }
    const totalCents = subtotalCents + taxCents - discountCents;
    return { subtotalCents, taxCents, discountCents, totalCents, count: lines.length, itemCount: lines.reduce((s, l) => s + l.quantity, 0) };
}

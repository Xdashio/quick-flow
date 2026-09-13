/** Client-safe formatters — no server imports (lib/api.ts pulls in next/headers). */

export function formatKes(cents: number): string {
  return `KES ${(cents / 100).toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(iso: string | Date): string {
  return new Date(iso).toLocaleString('en-KE', {
    timeZone: 'Africa/Nairobi',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format stock quantities:
 * - Whole-unit items (isWeighed=false): formatted as integer (e.g. 15, 1,250, 0)
 * - Weighed items (isWeighed=true): formatted up to 3 decimal places without trailing zeros (e.g. 12.5, 0.125, 12)
 */
export function formatStock(
  quantity: number | string | null | undefined,
  isWeighed: boolean = false,
  unitType?: string,
): string {
  let num = typeof quantity === 'string' ? parseFloat(quantity) : (quantity ?? 0);
  if (isNaN(num)) return unitType ? `0 ${unitType}` : '0';
  if (Object.is(num, -0) || Math.abs(num) < 0.0005) {
    num = 0;
  }

  if (!isWeighed) {
    const formatted = Math.round(num).toLocaleString('en-KE');
    return unitType ? `${formatted} ${unitType}` : formatted;
  }

  const formatted = Number(num.toFixed(3)).toLocaleString('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
  return unitType ? `${formatted} ${unitType}` : formatted;
}

export type StockStatusLevel = 'normal' | 'low' | 'out';

export interface StockStatusInfo {
  status: StockStatusLevel;
  color: string;
  bg: string;
  border: string;
  dotColor: string;
  label: string;
}

export function getStockStatus(
  totalStock: number,
  reorderPoint?: number | null,
  unitType = 'each',
  isWeighed = false,
): StockStatusInfo {
  const formatted = formatStock(totalStock, isWeighed, unitType);

  if (totalStock <= 0) {
    return {
      status: 'out',
      color: 'var(--accent-rose)',
      bg: 'var(--accent-rose-bg)',
      border: '1px solid rgba(224, 109, 115, 0.3)',
      dotColor: 'var(--accent-rose)',
      label: totalStock < 0 ? `${formatted} (Deficit)` : 'Out of stock',
    };
  }

  if (reorderPoint !== null && reorderPoint !== undefined && totalStock <= reorderPoint) {
    return {
      status: 'low',
      color: 'var(--accent-amber)',
      bg: 'var(--accent-amber-bg)',
      border: '1px solid rgba(224, 159, 62, 0.35)',
      dotColor: 'var(--accent-amber)',
      label: `${formatted} (Low)`,
    };
  }

  return {
    status: 'normal',
    color: 'var(--accent-emerald)',
    bg: 'var(--accent-emerald-bg)',
    border: '1px solid rgba(95, 173, 124, 0.3)',
    dotColor: 'var(--accent-emerald)',
    label: `${formatted} in stock`,
  };
}


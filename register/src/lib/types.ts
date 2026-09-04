export interface CachedProduct {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  unit_type: string;
  is_weighed: number; // 0 or 1
  price_cents: number;
  tax_category_id: string | null;
  category_id: string | null;
  active: number;
  /** R2 object key synced from backend */
  image_key: string | null;
  /** ISO timestamp set when image was successfully downloaded to disk */
  image_cached_at: string | null;
  created_at: string;
  updated_at: string;
  tax_category_name?: string | null;
  tax_category_rate_bp?: number | null;
  category_name?: string | null;
}

export interface CachedTaxCategory {
  id: string;
  name: string;
  rate_bp: number; // e.g. 1600 = 16.00%
}

export interface CachedCategory {
  id: string;
  name: string;
  parent_id: string | null;
}

export interface SyncStatus {
  success: boolean;
  isOnline: boolean;
  lastSyncAt: string | null;
  status: "idle" | "syncing" | "synced" | "offline" | "error";
  productsCount: number;
  taxCategoriesCount: number;
  pendingCount?: number;
  pendingFlush?: any;
  errorMessage?: string | null;
}

export interface CartItem {
  id: string; // line item uuid
  productId: string;
  sku: string;
  barcode: string | null;
  name: string;
  priceCents: number;
  quantity: number;
  unitType: string;
  isWeighed: boolean;
  taxCategoryId: string | null;
  taxCategoryName: string;
  taxRateBp: number;
  lineSubtotalCents: number;
  lineTaxCents: number;
  lineTotalCents: number;
}

export interface TaxGroupSummary {
  taxCategoryId: string;
  name: string;
  rateBp: number;
  taxableAmountCents: number;
  taxCents: number;
}

export interface CartTotals {
  itemCount: number;
  subtotalCents: number;
  totalTaxCents: number;
  grandTotalCents: number;
  taxGroups: TaxGroupSummary[];
}
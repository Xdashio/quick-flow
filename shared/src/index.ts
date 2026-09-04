/**
 * @pos/shared — canonical types for POS monorepo
 * Imported by backend, register, and dashboard — never duplicated.
 * Strict TypeScript 7, integer cents for money (never float).
 */

// ───────────────────── Enums ─────────────────────

export type UnitType = "each" | "kg" | "lb" | "oz";

export type TaxCategoryName = "standard" | "zero_rated" | "exempt";

export type TransactionStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "AWAITING_PAYMENT"
  | "PAYMENT_CAPTURED"
  | "COMPLETED"
  | "PAYMENT_FAILED"
  | "VOIDED"
  | "REFUND_REQUESTED"
  | "REFUNDED"
  | "VOID_REQUESTED";

export type PaymentMethod = "cash" | "mpesa_stk" | "mpesa_till" | "store_credit";

export type PaymentStatus =
  | "pending"
  | "awaiting_confirmation"
  | "captured"
  | "failed"
  | "refunded";

export type InventoryReason =
  | "sale"
  | "return"
  | "receiving"
  | "shrinkage"
  | "adjustment"
  | "waste";

export type UserRole = "cashier" | "manager" | "admin";

export type DrawerReason = "sale" | "no_sale" | "manager_override" | "change";

// ───────────────────── Entities ─────────────────────

export interface TaxCategory {
  id: string;
  name: TaxCategoryName | string;
  rateBp: number; // basis points, e.g. 1600 = 16%
}

export interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  unitType: UnitType;
  isWeighed: boolean;
  priceCents: number;
  taxCategoryId: string | null;
  categoryId: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  locationId: string;
  quantityDelta: number; // NUMERIC(10,3) — signed
  reason: InventoryReason;
  referenceId: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface CurrentInventory {
  productId: string;
  locationId: string;
  quantity: number;
}

export interface Transaction {
  id: string; // client-generated UUID for idempotent sync
  locationId: string;
  registerId: string | null;
  cashierId: string | null;
  status: TransactionStatus;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  customerId: string | null;
  voidedReason: string | null;
  parentTransactionId: string | null;
  createdAt: string;
  syncedAt: string | null;
}

export interface LineItem {
  id: string;
  transactionId: string;
  productId: string;
  quantity: number;
  unitPriceCents: number; // frozen at time of sale
  taxRateBp: number; // frozen at time of sale
  discountCents: number;
  lineTotalCents: number;
}

export interface Payment {
  id: string;
  transactionId: string;
  method: PaymentMethod;
  amountCents: number;
  mpesaReceiptNumber: string | null;
  mpesaPhoneNumber: string | null;
  checkoutRequestId: string | null;
  etimsInvoiceNumber: string | null;
  status: PaymentStatus;
}

export interface Customer {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  loyaltyPoints: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  // pinHash never exposed to client — only via safe DTO
  role: UserRole;
  active: boolean;
}

export interface Location {
  id: string;
  name: string;
  address: string | null;
  createdAt: string;
}

export interface Register {
  id: string;
  locationId: string;
  name: string;
  createdAt: string;
}

// ───────────────────── DTOs ─────────────────────

export interface CreateProductDto {
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  unitType?: UnitType;
  isWeighed?: boolean;
  priceCents: number;
  taxCategoryId?: string | null;
  categoryId?: string | null;
}

export interface CreateTransactionDto {
  id?: string; // client-generated UUID — if omitted server generates one
  locationId: string;
  registerId?: string | null;
  cashierId?: string | null;
  customerId?: string | null;
}

export interface TransitionTransactionDto {
  status: TransactionStatus;
  voidedReason?: string | null;
}

export interface CreatePaymentDto {
  method: PaymentMethod;
  amountCents: number;
  mpesaReceiptNumber?: string | null;
  mpesaPhoneNumber?: string | null;
  checkoutRequestId?: string | null;
}

/**
 * Aidly PMS — Single Shared Label-Value Constants
 * Sourced directly from `apps/aidlyPms/database/label_values.json` & `db_script.sql`.
 * This single file serves as the centralized source of truth for all dropdown,
 * filter, and lookup options used across all features, services, and components.
 */

export interface LabelOption<T = number> {
  readonly label: string;
  readonly value: T;
  readonly code?: string;
  readonly color?: string;
}

// 1. Business Mode
export const BUSINESS_MODE_OPTIONS: readonly LabelOption[] = [
  { label: 'Retail', value: 1 },
  { label: 'Wholesale', value: 2 },
] as const;

export const BusinessMode = {
  Retail: 1,
  Wholesale: 2,
} as const;
export type BusinessMode = (typeof BusinessMode)[keyof typeof BusinessMode];

// 2. Discount Type
export const DISCOUNT_TYPE_OPTIONS: readonly LabelOption[] = [
  { label: 'Percentage', value: 1 },
  { label: 'Flat', value: 2 },
] as const;

export const DiscountType = {
  Percentage: 1,
  Flat: 2,
} as const;
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];

// 3. Payment Method
export const PAYMENT_METHOD_OPTIONS: readonly LabelOption[] = [
  { label: 'Cash', value: 1 },
  { label: 'Bank', value: 2 },
  { label: 'bKash', value: 3 },
  { label: 'Nagad', value: 4 },
  { label: 'Rocket', value: 5 },
  { label: 'Card', value: 6 },
  { label: 'Due', value: 7 },
  { label: 'Split', value: 8 },
] as const;

export const PaymentMethod = {
  Cash: 1,
  Bank: 2,
  bKash: 3,
  Nagad: 4,
  Rocket: 5,
  Card: 6,
  Due: 7,
  Split: 8,
  ReturnCredit: 9,
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

// 4. Purchase Calculation Mode
export const PURCHASE_CALC_MODE_OPTIONS: readonly LabelOption[] = [
  { label: 'Default', value: 1 },
  { label: 'Unit TP/VAT', value: 2 },
  { label: 'Net Value', value: 3 },
  { label: 'Opening Stock', value: 4 },
] as const;

export const PurchaseCalcMode = {
  Default: 1,
  UnitTpVat: 2,
  NetValue: 3,
  OpeningStock: 4,
} as const;
export type PurchaseCalcMode = (typeof PurchaseCalcMode)[keyof typeof PurchaseCalcMode];

// 5. Inventory Transaction Type
export const INVENTORY_TYPE_OPTIONS: readonly LabelOption[] = [
  { label: 'INVENTORY PURCHASED', value: 1 },
  { label: 'OPENING STOCK', value: 2 },
  { label: 'CUSTOMER RETURNED', value: 3 },
  { label: 'SUPPLIER RETURNED', value: 4 },
  { label: 'TRANSFER IN', value: 5 },
  { label: 'TRANSFER OUT', value: 6 },
  { label: 'ADJUSTMENT', value: 7 },
] as const;

export const InventoryType = {
  InventoryPurchased: 1,
  OpeningStock: 2,
  CustomerReturned: 3,
  SupplierReturned: 4,
  TransferIn: 5,
  TransferOut: 6,
  Adjustment: 7,
} as const;
export type InventoryType = (typeof InventoryType)[keyof typeof InventoryType];

// 6. Cash Received Status
export const CASH_RECEIVED_STATUS_OPTIONS: readonly LabelOption[] = [
  { label: 'Pending', value: 1, color: 'gold' },
  { label: 'Received', value: 2, color: 'green' },
] as const;

export const CashReceivedStatus = {
  Pending: 1,
  Received: 2,
} as const;
export type CashReceivedStatus = (typeof CashReceivedStatus)[keyof typeof CashReceivedStatus];

// 7. Customer Tier
export const CUSTOMER_TIER_OPTIONS: readonly LabelOption[] = [
  { label: 'Regular', value: 1 },
  { label: 'Wholesale Client', value: 2 },
  { label: 'VIP', value: 3 },
  { label: 'Staff', value: 4 },
  { label: 'Doctor Referral', value: 5 },
] as const;

export const CustomerTier = {
  Regular: 1,
  WholesaleClient: 2,
  VIP: 3,
  Staff: 4,
  DoctorReferral: 5,
} as const;
export type CustomerTier = (typeof CustomerTier)[keyof typeof CustomerTier];

// 8. Gender
export const GENDER_OPTIONS: readonly LabelOption[] = [
  { label: 'Male', value: 1 },
  { label: 'Female', value: 2 },
  { label: 'Other', value: 3 },
] as const;

export const Gender = {
  Male: 1,
  Female: 2,
  Other: 3,
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

// 9. Account Type
export const ACCOUNT_TYPE_OPTIONS: readonly LabelOption[] = [
  { label: 'Cash In Hand', value: 1 },
  { label: 'Bank Account', value: 2 },
  { label: 'bKash Personal', value: 3 },
  { label: 'bKash Merchant', value: 4 },
  { label: 'Nagad', value: 5 },
  { label: 'Rocket', value: 6 },
  { label: 'Card POS Machine', value: 7 },
  { label: 'Other', value: 99 },
] as const;

export const AccountType = {
  CashInHand: 1,
  BankAccount: 2,
  BkashPersonal: 3,
  BkashMerchant: 4,
  Nagad: 5,
  Rocket: 6,
  CardPosMachine: 7,
  Other: 99,
} as const;
export type AccountType = (typeof AccountType)[keyof typeof AccountType];

// 10. Medicine Type / Form
export const MEDICINE_TYPE_OPTIONS: readonly LabelOption[] = [
  { label: 'Tablet', value: 1 },
  { label: 'Capsule', value: 2 },
  { label: 'Syrup', value: 3 },
  { label: 'Suspension', value: 4 },
  { label: 'Drop', value: 5 },
  { label: 'Injection', value: 6 },
  { label: 'Ointment', value: 7 },
  { label: 'Gel', value: 8 },
  { label: 'Cream', value: 9 },
  { label: 'Inhaler', value: 10 },
  { label: 'Suppository', value: 11 },
  { label: 'Powder', value: 12 },
  { label: 'Other', value: 99 },
] as const;

export const MedicineType = {
  Tablet: 1,
  Capsule: 2,
  Syrup: 3,
  Suspension: 4,
  Drop: 5,
  Injection: 6,
  Ointment: 7,
  Gel: 8,
  Cream: 9,
  Inhaler: 10,
  Suppository: 11,
  Powder: 12,
  Other: 99,
} as const;
export type MedicineType = (typeof MedicineType)[keyof typeof MedicineType];

// 11. Unit Type
export const UNIT_TYPE_OPTIONS: readonly LabelOption[] = [
  { label: 'PIECE', value: 1 },
  { label: 'STRIP', value: 2 },
  { label: 'BOX', value: 3 },
  { label: 'BOTTLE', value: 4 },
  { label: 'TUBE', value: 5 },
  { label: 'VIAL', value: 6 },
  { label: 'AMPOULE', value: 7 },
  { label: 'PACKET', value: 8 },
] as const;

export const UnitType = {
  Piece: 1,
  Strip: 2,
  Box: 3,
  Bottle: 4,
  Tube: 5,
  Vial: 6,
  Ampoule: 7,
  Packet: 8,
} as const;
export type UnitType = (typeof UnitType)[keyof typeof UnitType];

// 12. Paper Type
export const PAPER_TYPE_OPTIONS: readonly LabelOption[] = [
  { label: '80mm', value: 1 },
  { label: '58mm', value: 2 },
  { label: 'A4', value: 3 },
] as const;

export const PaperType = {
  Width80mm: 1,
  Width58mm: 2,
  A4: 3,
} as const;
export type PaperType = (typeof PaperType)[keyof typeof PaperType];

// 13. Subscription Status
export const SUBSCRIPTION_STATUS_OPTIONS: readonly LabelOption[] = [
  { label: 'Trial', value: 1, color: 'blue' },
  { label: 'Active', value: 2, color: 'green' },
  { label: 'Overdue', value: 3, color: 'orange' },
  { label: 'Suspended', value: 4, color: 'red' },
  { label: 'Cancelled', value: 5, color: 'default' },
] as const;

export const SubscriptionStatus = {
  Trial: 1,
  Active: 2,
  Overdue: 3,
  Suspended: 4,
  Cancelled: 5,
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

// 14. Billing Cycle
export const BILLING_CYCLE_OPTIONS: readonly LabelOption[] = [
  { label: 'Monthly', value: 1 },
  { label: 'Yearly', value: 2 },
] as const;

export const BillingCycle = {
  Monthly: 1,
  Yearly: 2,
} as const;
export type BillingCycle = (typeof BillingCycle)[keyof typeof BillingCycle];

// 15. Standard Pharmaceutical Companies (matches prod_companies master)
export const DEFAULT_COMPANIES: readonly string[] = [
  'Beximco Pharmaceuticals Ltd.',
  'Square Pharmaceuticals PLC',
  'ACI Limited',
  'Incepta Pharmaceuticals Ltd.',
  'Renata Limited',
  'Eskayef Pharmaceuticals Ltd.',
  'Aristopharma Ltd.',
  'General Pharmaceuticals Ltd.',
  'Opsonin Pharma Ltd.',
  'Acme Laboratories Ltd.',
] as const;

// 16. Standard Generic Formulations (matches prod_generics master)
export const DEFAULT_GENERICS: readonly string[] = [
  'Paracetamol',
  'Amoxicillin',
  'Amoxicillin Trihydrate',
  'Omeprazole',
  'Esomeprazole',
  'Esomeprazole Magnesium',
  'Metformin Hydrochloride',
  'Cefixime',
  'Azithromycin',
  'Atorvastatin Calcium',
  'Losartan Potassium',
  'Ciprofloxacin',
  'Dextromethorphan',
  'Montelukast',
  'Pantoprazole',
  'Cetirizine',
  'Rabeprazole',
] as const;

// 17. Standard Shelf / Rak Locations (matches pharmacy inventory layout)
export const DEFAULT_RAKS: readonly string[] = [
  'A-01',
  'A-01 (General OTC)',
  'A-02 (Antibiotics)',
  'A-09',
  'A-09 (Tablets)',
  'B-01 (Syrups & Suspensions)',
  'B-02 (Eye & Ear Drops)',
  'B-04',
  'B-04 (Capsules)',
  'C-01 (Injections & IV)',
  'C-02',
  'C-02 (Oral Liquids)',
  'Fridge-01 (Insulin & Vaccines)',
] as const;

/**
 * Unified Dictionary Map for Dynamic Lookup
 */
export const LABEL_VALUES = {
  business_mode: BUSINESS_MODE_OPTIONS,
  discount_type: DISCOUNT_TYPE_OPTIONS,
  payment_method: PAYMENT_METHOD_OPTIONS,
  purchase_calc_mode: PURCHASE_CALC_MODE_OPTIONS,
  inventory_type: INVENTORY_TYPE_OPTIONS,
  cash_received_status: CASH_RECEIVED_STATUS_OPTIONS,
  customer_tier: CUSTOMER_TIER_OPTIONS,
  gender: GENDER_OPTIONS,
  account_type: ACCOUNT_TYPE_OPTIONS,
  medicine_type: MEDICINE_TYPE_OPTIONS,
  unit_type: UNIT_TYPE_OPTIONS,
  paper_type: PAPER_TYPE_OPTIONS,
  subscription_status: SUBSCRIPTION_STATUS_OPTIONS,
  billing_cycle: BILLING_CYCLE_OPTIONS,
} as const;

export type LabelValueKey = keyof typeof LABEL_VALUES;

/**
 * Helper to retrieve text label for a given numeric value
 */
export function getOptionLabel(
  optionsOrKey: readonly LabelOption[] | LabelValueKey,
  value: number | null | undefined,
  fallback = '—'
): string {
  if (value === null || value === undefined) return fallback;
  const list = typeof optionsOrKey === 'string' ? LABEL_VALUES[optionsOrKey] : optionsOrKey;
  const match = list.find(item => item.value === value);
  return match ? match.label : fallback;
}

/**
 * Helper to retrieve numeric value for a given label string
 */
export function getOptionValue(
  optionsOrKey: readonly LabelOption[] | LabelValueKey,
  label: string | null | undefined
): number | undefined {
  if (!label) return undefined;
  const list = typeof optionsOrKey === 'string' ? LABEL_VALUES[optionsOrKey] : optionsOrKey;
  const match = list.find(item => item.label.toLowerCase() === label.trim().toLowerCase());
  return match?.value;
}

/**
 * Supplier & Purchase Invoicing Domain Models
 * Direct 1:1 field mapping to PostgreSQL schema in `db_script.sql`.
 * Tables: `supp_suppliers`, `pur_purchase_invoices`, `pur_purchase_invoice_items`,
 *         `pur_supplier_payments`, `pur_purchase_returns`, `pur_purchase_return_items`.
 */
import { ProdProduct } from './product.models';

export interface SuppSupplier {
  supplier_no: number;
  pharmacy_no: number;
  branch_no: number;
  name: string;
  phone: string;
  note?: string | null;
  current_due_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PurPurchaseInvoice {
  purchase_invoice_no: number;
  uuid: string;
  pharmacy_no: number;
  branch_no: number;
  supplier_no: number;
  inventory_number: string;
  calculation_mode: number;
  inventory_type: number;
  supplier_invoice_no?: string | null;
  total_items: number;
  gross_total_price: number;
  discount_type: number;
  discount_value: number;
  net_amount?: number;
  vat_amount?: number;
  round_off_amount?: number;
  final_price: number;
  paid_amount: number;
  due_amount: number;
  document_status?: number;
  created_by_user_no?: number | null;
  purchase_date: string;
  created_at: string;
  updated_at: string;

  // Navigation
  supplier?: SuppSupplier;
  items?: readonly PurPurchaseInvoiceItem[];
}

export interface PurPurchaseInvoiceItem {
  purchase_item_no: number;
  pharmacy_no: number;
  branch_no: number;
  purchase_invoice_no: number;
  product_no: number;
  batch_number?: string | null;
  box_qty: number;
  qty_in_box: number;
  total_qty_pcs: number;
  free_qty_pcs: number;
  btp?: number;
  vat_percent?: number;
  vat_amount?: number;
  btp_vat: number;
  unit_cost?: number;
  sale_price: number;
  total_price: number;
  expiry_date?: string | null;
  min_qty_pcs?: number | null;
  barcode_value?: string | null;

  // Navigation
  product?: ProdProduct;
}

export interface PurSupplierPayment {
  supplier_payment_no: number;
  pharmacy_no: number;
  branch_no: number;
  supplier_no: number;
  account_no: number;
  payment_number: string;
  payment_method: number;
  amount: number;
  reference_no?: string | null;
  note?: string | null;
  paid_by_user_no?: number | null;
  payment_date: string;
  created_at: string;
}

export interface PurPurchaseReturn {
  purchase_return_no: number;
  pharmacy_no: number;
  branch_no: number;
  supplier_no: number;
  purchase_invoice_no?: number | null;
  return_number: string;
  total_items: number;
  gross_return_amount: number;
  refund_received_amount: number;
  due_adjustment_amount: number;
  return_status: number;
  note?: string | null;
  created_by_user_no?: number | null;
  return_date: string;
  created_at: string;
  items?: readonly PurPurchaseReturnItem[];
}

export interface PurPurchaseReturnItem {
  purchase_return_item_no: number;
  pharmacy_no: number;
  branch_no: number;
  purchase_return_no: number;
  purchase_item_no?: number | null;
  product_no: number;
  batch_no?: number | null;
  batch_number?: string | null;
  return_qty_pcs: number;
  unit_purchase_price: number;
  total_return_amount: number;
  reason_code?: number | null;
}

// Backward-compatible type aliases
export type Supplier = SuppSupplier;
export type PurchaseInvoice = PurPurchaseInvoice;
export type PurchaseItem = PurPurchaseInvoiceItem;

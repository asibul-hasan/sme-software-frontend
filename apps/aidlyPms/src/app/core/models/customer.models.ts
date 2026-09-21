/**
 * Customer & Sales POS Domain Models
 * Direct 1:1 field mapping to PostgreSQL schema in `db_script.sql`.
 * Tables: `cust_customers`, `sale_invoices`, `sale_invoice_items`, `sale_invoice_payments`,
 *         `sale_returns`, `sale_return_items`.
 */
import { ProdProduct } from './product.models';

export interface CustCustomer {
  customer_no: number;
  uuid: string;
  pharmacy_no: number;
  branch_no: number;
  name: string;
  phone: string;
  gender: number;
  customer_type: number;
  discount_percent: number;
  email?: string | null;
  address?: string | null;
  note?: string | null;
  has_due: boolean;
  current_due: number;
  advance_balance?: number;
  promised_payment_date?: string | null;
  is_loyalty_member: boolean;
  loyalty_points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaleInvoice {
  sale_invoice_no: number;
  uuid: string;
  pharmacy_no: number;
  branch_no: number;
  customer_no: number;
  prescription_no?: number | null;
  prescription_image_url?: string | null;
  sales_number: string;
  sale_mode: number;
  total_items: number;
  gross_total_price: number;
  discount_type: number;
  discount_value: number;
  card_commission_percent: number;
  card_commission_amount: number;
  net_amount?: number;
  vat_amount?: number;
  round_off_amount?: number;
  final_price: number;
  approximate_profit: number;
  customer_will_pay: number;
  change_amount: number;
  due_amount: number;
  payment_method: number;
  document_status?: number;
  cash_received_status: number;
  received_by_user_no: number;
  salesman_user_no: number;
  is_quick_printed: boolean;
  sale_timestamp: string;
  created_at: string;
  updated_at: string;

  // Navigation
  customer?: CustCustomer;
  items?: readonly SaleInvoiceItem[];
  payments?: readonly SaleInvoicePayment[];
}

export interface SaleInvoiceItem {
  sale_invoice_item_no: number;
  pharmacy_no: number;
  branch_no: number;
  sale_invoice_no: number;
  product_no: number;
  batch_no: number;
  sale_mode: number;
  sale_qty: number;
  box_qty: number;
  pcs_per_box: number;
  unit_cost_price: number;
  unit_sale_price: number;
  discount_amount: number;
  vat_percent?: number;
  vat_amount?: number;
  net_amount?: number;
  total_price: number;

  // Navigation
  product?: ProdProduct;
}

export interface SaleInvoicePayment {
  sale_payment_no: number;
  pharmacy_no: number;
  branch_no: number;
  sale_invoice_no: number;
  account_no: number;
  payment_method: number;
  amount: number;
  gateway_reference?: string | null;
  created_at: string;
}

export interface SaleReturn {
  sale_return_no: number;
  pharmacy_no: number;
  branch_no: number;
  sale_invoice_no: number;
  customer_no: number;
  return_invoice_no: string;
  original_invoice_no: string;
  total_items: number;
  gross_refund_price: number;
  discount_deduction: number;
  net_amount?: number;
  vat_amount?: number;
  round_off_amount?: number;
  final_refund_price: number;
  cash_paid_refund: number;
  inventory_type: number;
  return_status?: number;
  created_by_user_no: number;
  return_date: string;
  created_at: string;

  // Navigation
  customer?: CustCustomer;
  items?: readonly SaleReturnItem[];
}

export interface SaleReturnItem {
  sale_return_item_no: number;
  pharmacy_no: number;
  branch_no: number;
  sale_return_no: number;
  sale_invoice_item_no?: number | null;
  product_no: number;
  batch_number: string;
  box_qty: number;
  qty_in_box: number;
  total_qty_pcs: number;
  btp_vat: number;
  sale_price: number;
  vat_percent?: number;
  vat_amount?: number;
  net_amount?: number;
  total_price: number;
  free_qty_pcs: number;
  expiry_date?: string | null;
  reason_code?: number;
  disposition?: number;

  // Navigation
  product?: ProdProduct;
}

// Backward-compatible type aliases
export type Customer = CustCustomer;
export type SaleOrder = SaleInvoice;
export type SaleOrderItem = SaleInvoiceItem;

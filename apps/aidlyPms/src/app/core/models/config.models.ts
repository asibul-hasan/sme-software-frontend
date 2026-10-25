/**
 * System Configurations & SMS Domain Models
 * Direct 1:1 field mapping to PostgreSQL schema in `db_script.sql`.
 * Tables: `cfg_sale_configs`, `cfg_invoice_configs`, `cfg_product_configs`, `cfg_loyalty_configs`, `cfg_bulk_sms_configs`, `cfg_sms_logs`.
 */

export interface CfgSaleConfig {
  sale_config_no: number;
  pharmacy_no: number;
  branch_no: number;
  cash_received: boolean;
  out_of_stock_sale: boolean;
  allow_loss_sale: boolean;
  product_purchase_cost: boolean;
  stock_qty: boolean;
  company_name: boolean;
  profit_margin: boolean;
  rak_number: boolean;
  opening_stock_percent: number;
  max_sale_discount_percent: number;
  is_max_discount_enabled: boolean;
  business_type: number;
  return_window_days?: number;
  offline_pos_enabled: boolean;
  offline_max_age_hours: number;
  updated_at: string;
}

export interface CfgInvoiceConfig {
  invoice_config_no: number;
  pharmacy_no: number;
  branch_no: number;
  paper_type: number;
  top_row_text?: string | null;
  show_served_by_row: boolean;
  show_discount_less_row: boolean;
  show_card_fee_row: boolean;
  show_customer_name: boolean;
  show_customer_phone: boolean;
  simple_print: boolean;
  show_customer_vendor_balance: boolean;
  show_shop_logo: boolean;
  shop_logo_url?: string | null;
  bottom_row_text?: string | null;
  updated_at: string;
}

export interface CfgProductConfig {
  product_config_no: number;
  pharmacy_no: number;
  branch_no: number;
  expired_notification_days: number;
  updated_at: string;
}

export interface CfgLoyaltyConfig {
  loyalty_config_no: number;
  pharmacy_no: number;
  branch_no: number;
  is_enabled: boolean;
  earning_spend_amount_per_point: number;
  redemption_points_per_taka: number;
  min_redeem_points: number;
  max_redeem_limit_per_tx: number;
  updated_at: string;
}

export interface CfgBulkSmsConfig {
  bulk_sms_config_no: number;
  pharmacy_no: number;
  branch_no: number;
  current_sms_count: number;
  sms_pack_unit_size: number;
  sms_pack_unit_price: number;
  sender_id?: string | null;
  updated_at: string;
}

export interface CfgSmsLog {
  sms_log_no: number;
  pharmacy_no: number;
  branch_no: number;
  customer_no?: number | null;
  recipient_phone: string;
  message_body: string;
  sms_parts_count: number;
  dispatch_status: string;
  sent_at: string;
}

// Backward-compatible type aliases
export type SaleConfig = CfgSaleConfig;
export type InvoiceConfig = CfgInvoiceConfig;
export type ProductConfig = CfgProductConfig;
export type LoyaltyConfig = CfgLoyaltyConfig;
export type BulkSmsConfig = CfgBulkSmsConfig;
export type SmsLog = CfgSmsLog;

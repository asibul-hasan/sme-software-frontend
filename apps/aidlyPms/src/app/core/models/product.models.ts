/**
 * Product & Inventory Domain Models
 * Direct 1:1 field mapping to PostgreSQL schema in `db_script.sql`.
 * Tables: `prod_companies`, `prod_generics`, `prod_products`, `prod_product_batches`,
 *         `prod_product_requisitions`, `prod_product_requisition_items`.
 */

export interface ProdCompany {
  company_no: number;
  pharmacy_no: number;
  branch_no?: number;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProdGeneric {
  generic_no: number;
  pharmacy_no: number;
  branch_no?: number;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProdProduct {
  product_no: number;
  uuid: string;
  pharmacy_no: number;
  branch_no?: number;
  company_no: number; // Foreign Key -> prod_companies (Manufacturer)
  generic_no?: number | null;
  product_name: string;
  strength?: string | null;
  volume?: string | null;
  medicine_type: number;
  unit_type: number;
  quantity_per_box: number;
  cost_per_box: number;
  sale_price_per_box: number;
  avg_purchase_price_per_piece: number;
  purchase_price_per_piece: number;
  sale_price_per_piece: number;
  wholesale_price_per_box?: number;
  wholesale_price_per_piece?: number;
  country_of_origin?: string | null;
  barcode_value?: string | null;
  is_medicine: boolean;
  is_prescription_required?: boolean;
  is_narcotic?: boolean;
  min_stock_qty_pcs: number;
  rak_number?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Navigation and frontend compatibility fields
  brand_name?: string; // alias for product_name
  generic_name?: string; // alias for generic?.name
  company_name?: string; // alias for company?.name
  stock_qty?: number;
  company?: ProdCompany;
  generic?: ProdGeneric;
}

export interface ProdProductBatch {
  batch_no: number;
  pharmacy_no: number;
  branch_no?: number;
  product_no: number;
  batch_number: string;
  expiry_date: string;
  box_quantity: number;
  quantity_in_box: number;
  total_quantity_pcs: number;
  cost_per_box: number;
  sale_price_per_box: number;
  vat_percent: number;
  barcode_value?: string | null;
  is_expired: boolean;
  created_at: string;
  updated_at: string;

  // Navigation
  product?: ProdProduct;
  product_name?: string;
}

export interface ProdProductRequisition {
  requisition_no: number;
  requisition_code: string;
  pharmacy_no: number;
  branch_no?: number;
  company_no?: number | null; // Manufacturer reference
  company_name?: string | null;
  supplier_no?: number | null;
  supplier_name?: string | null;
  total_selected_items: number;
  total_cost: number;
  is_as_per_sale: boolean;
  sale_velocity_start_date?: string | null;
  sale_velocity_end_date?: string | null;
  status: string;
  created_by_user_no?: number | null;
  created_at: string;
  updated_at: string;

  // Navigation
  items?: readonly ProdProductRequisitionItem[];
}

export interface ProdProductRequisitionItem {
  requisition_item_no: number;
  pharmacy_no: number;
  branch_no?: number;
  requisition_no: number;
  product_no: number;
  box_qty: number;
  min_qty_pcs: number;
  sale_qty_6mth_pcs: number;
  quantity_in_box: number;
  btp: number;
  vat: number;
  btp_vat: number;
  total_price: number;
  is_selected: boolean;

  // Navigation & Joined fields
  product_name?: string;
  product?: ProdProduct;
}

// Backward-compatible type aliases
export type ProductCompany = ProdCompany;
export type GenericDrug = ProdGeneric;
export type Product = ProdProduct;
export type ProductBatch = ProdProductBatch;
export type InventoryRequisition = ProdProductRequisition;
export type RequisitionItem = ProdProductRequisitionItem;

export interface LowStockProduct {
  product_no: number;
  product_name: string;
  brand_name: string;
  generic_name: string;
  company_no?: number;
  company_name: string;
  current_stock_pcs: number;
  min_stock_qty_pcs: number;
  shortfall_pcs: number;
  quantity_per_box: number;
  suggested_box_qty: number;
  purchase_price_per_piece: number;
  cost_per_box: number;
  sale_price_per_piece: number;
  vat_percent: number;
  sale_qty_6mth_pcs: number;
  estimated_total_cost: number;
}

export interface ProductImportItem {
  product_name: string;
  strength?: string;
  volume?: string;
  company_name?: string;
  generic_name?: string;
  medicine_form?: string;
  medicine_type?: number;
  unit_type_name?: string;
  unit_type?: number;
  quantity_per_box?: number;
  cost_per_box?: number;
  sale_price_per_box?: number;
  purchase_price_per_piece?: number;
  sale_price_per_piece?: number;
  wholesale_price_per_box?: number;
  wholesale_price_per_piece?: number;
  country_of_origin?: string;
  barcode_value?: string;
  rak_number?: string;
  min_stock_qty_pcs?: number;
  is_prescription_required?: boolean;
  is_narcotic?: boolean;
  opening_stock_pcs?: number;
}

export interface ProductImportResult {
  total_rows: number;
  inserted: number;
  updated: number;
  new_companies_created: number;
  new_generics_created: number;
  errors: string[];
}

export interface TemplateMetadata {
  companies: string[];
  generics: string[];
  dosage_forms: string[];
  unit_types: string[];
  sample_data: Record<string, unknown>;
}

export interface StockReportSummary {
  total_products: number;
  in_stock_items: number;
  low_stock_items: number;
  out_of_stock_items: number;
  total_stock_pcs: number;
  total_cost_valuation: number;
  total_sale_valuation: number;
  potential_profit: number;
}

export interface StockReportItem {
  product_no: number;
  product_name: string;
  strength?: string | null;
  company_name?: string | null;
  generic_name?: string | null;
  quantity_per_box: number;
  current_stock_pcs: number;
  current_stock_boxes: number;
  min_stock_qty_pcs: number;
  purchase_price_per_piece: number;
  sale_price_per_piece: number;
  cost_valuation: number;
  sale_valuation: number;
  profit_margin_pct: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | string;
  rak_number?: string | null;
}

export interface StockReportResult {
  summary: StockReportSummary;
  items: StockReportItem[];
  total_count: number;
}



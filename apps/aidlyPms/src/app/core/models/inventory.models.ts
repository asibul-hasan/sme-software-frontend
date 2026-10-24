/**
 * Inventory Operations & Universal Stock Movement Domain Models
 * Direct 1:1 field mapping to PostgreSQL schema in `db_script.sql`.
 * Tables: `inv_stock_movement`, `inv_transfers`, `inv_transfer_items`, `inv_adjustments`, `inv_adjustment_items`.
 */

export interface InvStockMovement {
  movement_no: number;
  pharmacy_no: number;
  branch_no: number;
  product_no: number;
  batch_no?: number | null;
  movement_type: number;
  reference_doc_type: string;
  reference_doc_no: string;
  reference_doc_id: number;
  qty_pcs: number;
  unit_cost: number;
  balance_after_pcs: number;
  remarks?: string | null;
  created_by_user_no?: number | null;
  created_at: string;
}

export interface InvTransfer {
  transfer_no: number;
  pharmacy_no: number;
  branch_no: number;
  transfer_number: string;
  from_branch_no: number;
  to_branch_no: number;
  total_items: number;
  total_cost_amount: number;
  transfer_status: number;
  note?: string | null;
  sent_by_user_no?: number | null;
  received_by_user_no?: number | null;
  sent_at: string;
  received_at?: string | null;
  created_at: string;
  items?: readonly InvTransferItem[];
  from_branch_name?: string;
  to_branch_name?: string;
}

export interface InvTransferItem {
  transfer_item_no: number;
  pharmacy_no: number;
  branch_no: number;
  transfer_no: number;
  product_no: number;
  product_name?: string;
  batch_no?: number | null;
  batch_number?: string | null;
  qty_pcs: number;
  unit_cost: number;
  total_cost: number;
  expiry_date?: string | null;
}

export interface InvAdjustment {
  adjustment_no: number;
  pharmacy_no: number;
  branch_no: number;
  adjustment_number: string;
  adjustment_type: number;
  total_items: number;
  net_cost_adjustment: number;
  adjustment_status: number;
  approved_by_user_no?: number | null;
  note?: string | null;
  adjustment_date: string;
  created_at: string;
  items?: readonly InvAdjustmentItem[];
}

export interface InvAdjustmentItem {
  adjustment_item_no: number;
  pharmacy_no: number;
  branch_no: number;
  adjustment_no: number;
  product_no: number;
  batch_no?: number | null;
  batch_number?: string | null;
  counted_qty_pcs: number;
  system_qty_pcs: number;
  difference_qty_pcs: number;
  unit_cost: number;
  total_cost_impact: number;
  reason_code?: number | null;
}

export interface InvStocktake {
  stocktake_no: number;
  pharmacy_no: number;
  branch_no: number;
  status: string;
  note?: string | null;
  started_at: string;
  started_by?: number | null;
  posted_at?: string | null;
  posted_by?: number | null;
  created_at: string;
  updated_at: string;
  items?: readonly InvStocktakeItem[];
  started_by_name?: string;
  posted_by_name?: string;
  total_items?: number;
  total_counted?: number;
  total_variance?: number;
}

export interface InvStocktakeItem {
  stocktake_item_no: number;
  pharmacy_no: number;
  branch_no: number;
  stocktake_no: number;
  product_no: number;
  batch_no?: number | null;
  system_qty_pcs: number;
  counted_qty_pcs?: number | null;
  variance_pcs?: number | null;
  reason?: string | null;
  // UI Display Fields
  product_name?: string;
  batch_number?: string;
  expiry_date?: string;
  unit_cost?: number;
  cost_per_box?: number;
  quantity_in_box?: number;
  company_name?: string;
  generic_name?: string;
  rak_number?: string;
}

export interface StocktakeCreateRequest {
  note?: string | null;
  filter_type?: 'ALL' | 'RACK' | 'COMPANY' | 'PRODUCTS';
  rack_number?: string | null;
  company_no?: number | null;
  product_nos?: number[] | null;
}

export interface StocktakeCountItem {
  stocktake_item_no: number;
  counted_qty_pcs: number;
  reason?: string | null;
}

export interface StocktakeCountSaveRequest {
  items: StocktakeCountItem[];
}

export interface StocktakePostRequest {
  items?: StocktakeCountItem[];
}

export interface StockIntegrityResult {
  mismatched_batch_count: number;
  negative_batch_count: number;
  positive_placeholder_count: number;
  orphan_batch_count: number;
  total_discrepancies: number;
  is_clean: boolean;
  sample_discrepancies: StockIntegrityDiscrepancyItem[];
}

export interface StockIntegrityDiscrepancyItem {
  batch_no: number;
  product_no: number;
  product_name: string;
  batch_number: string;
  batch_quantity: number;
  ledger_sum_quantity: number;
  variance: number;
  issue_type: string;
  is_placeholder: boolean;
}

export interface UnreceivedSaleItem {
  batch_no: number;
  product_no: number;
  product_name: string;
  generic_name?: string;
  total_quantity_pcs: number;
  unreceived_qty: number;
  first_sale_date: string;
  created_at: string;
}


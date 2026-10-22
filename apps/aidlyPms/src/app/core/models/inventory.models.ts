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

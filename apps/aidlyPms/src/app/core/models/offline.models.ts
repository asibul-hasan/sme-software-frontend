import { CfgSaleConfig } from './config.models';
import { SaleInvoice } from './customer.models';
import { CreateSalePayload } from '../services/pos-sale.service';

export interface SnapshotProductDto {
  product_no: number;
  product_name: string;
  generic_name?: string;
  company_name?: string;
  strength?: string;
  form_type?: string;
  barcode_value?: string;
  box_size: number;
  unit_price: number;
  mrp: number;
  purchase_price: number;
  vat_percent: number;
  is_narcotic: boolean;
  is_prescription_required: boolean;
  is_active: boolean;
  updated_at: string;
}

export interface SnapshotBatchDto {
  batch_no: number;
  product_no: number;
  batch_number: string;
  expiry_date: string;
  cost_price: number;
  sale_price: number;
  mrp: number;
  available_qty: number;
  box_qty: number;
  rack_number?: string;
  updated_at: string;
}

export interface SnapshotCustomerDto {
  customer_no: number;
  customer_name: string;
  phone?: string;
  address?: string;
  current_due: number;
  loyalty_points: number;
  updated_at: string;
}

export interface PosCatalogSnapshotDto {
  server_time_utc: string;
  snapshot_version: string;
  config: CfgSaleConfig;
  products: SnapshotProductDto[];
  batches: SnapshotBatchDto[];
  customers: SnapshotCustomerDto[];
}

export type QueueItemStatus = 'Pending' | 'Syncing' | 'Synced' | 'Failed' | 'Discarded';

export interface QueuedSale {
  idempotency_key: string; // UUID
  offline_receipt_no: string;
  created_at: string; // ISO string
  client_created_at: string; // ISO string
  offline_client_total: number;
  status: QueueItemStatus;
  retry_count: number;
  last_error?: string;
  payload: CreateSalePayload;
  synced_at?: string;
  server_sale_invoice_no?: number;
  server_sales_number?: string;
  price_variance?: number | null;
  late_sync?: boolean;
}

export interface SyncLogEntry {
  id?: number;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: unknown;
}

export type QueueItemStatus = 'Pending' | 'Syncing' | 'Synced' | 'Failed' | 'Discarded';

export interface CreateSalePayload {
  invoice: {
    pharmacy_no: number;
    branch_no: number;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    customer_no: number;
    payment_method: number;
    invoice_date: string;
    idempotency_key?: string;
    is_offline?: boolean;
    client_created_at?: string;
    offline_receipt_no?: string;
    offline_client_total?: number;
    items: any[];
    [key: string]: any;
  };
  [key: string]: any;
}

export interface QueuedSale {
  idempotency_key: string;
  offline_receipt_no: string;
  created_at: string;
  client_created_at: string;
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

/**
 * Calculates exponential backoff delay in milliseconds.
 * Schedule: 1s, 2s, 4s, 8s, 16s, capped at maxMs (default 30s).
 */
export function computeBackoffDelay(retryCount: number, baseMs = 1000, maxMs = 30000): number {
  if (retryCount <= 0) return baseMs;
  const delay = baseMs * Math.pow(2, retryCount);
  return Math.min(delay, maxMs);
}

/**
 * Validates that a discard reason is provided and non-empty.
 */
export function validateDiscardReason(reason: string): string {
  if (!reason || !reason.trim()) {
    throw new Error('Discard reason is required.');
  }
  return reason.trim();
}

/**
 * Sorts queue items in FIFO order (oldest created_at first).
 */
export function sortQueueFifo<T extends { created_at: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

/**
 * Filters queue items to return only Pending items for automatic sync.
 * Failed and Discarded items are excluded from auto-sync.
 */
export function filterPendingQueue<T extends { status: QueueItemStatus }>(items: T[]): T[] {
  return items.filter(s => s.status === 'Pending');
}

export interface SyncResult {
  success: number;
  failed: number;
  haltedByAuth: boolean;
}

export type ApiPostHandler = (
  endpoint: string,
  payload: CreateSalePayload
) => Promise<{ sale_invoice_no: number; sales_number: string; price_variance?: number | null; late_sync?: boolean }>;

/**
 * Pure queue processor that executes sync passes over queued sales,
 * honoring FIFO order, 401 auth halts, 4xx failed status, and idempotency key preservation.
 */
export class OfflineQueueProcessor {
  private items: QueuedSale[];

  constructor(items: QueuedSale[] = []) {
    this.items = [...items];
  }

  getItems(): QueuedSale[] {
    return [...this.items];
  }

  enqueue(sale: QueuedSale): void {
    this.items.push(sale);
  }

  getItem(idempotencyKey: string): QueuedSale | undefined {
    return this.items.find(i => i.idempotency_key === idempotencyKey);
  }

  getPendingQueue(): QueuedSale[] {
    const pending = filterPendingQueue(this.items);
    return sortQueueFifo(pending);
  }

  async retrySale(idempotencyKey: string): Promise<boolean> {
    const item = this.getItem(idempotencyKey);
    if (!item) return false;

    item.status = 'Pending';
    item.last_error = undefined;
    return true;
  }

  discardSale(idempotencyKey: string, reason: string): void {
    const validReason = validateDiscardReason(reason);
    const item = this.getItem(idempotencyKey);
    if (!item) {
      throw new Error(`Item with key ${idempotencyKey} not found.`);
    }
    item.status = 'Discarded';
    item.last_error = `Discarded: ${validReason}`;
  }

  async syncAll(apiPost: ApiPostHandler): Promise<SyncResult> {
    const queue = this.getPendingQueue();
    let success = 0;
    let failed = 0;
    let haltedByAuth = false;

    for (const item of queue) {
      item.status = 'Syncing';

      const payload: CreateSalePayload = {
        ...item.payload,
        invoice: {
          ...item.payload.invoice,
          idempotency_key: item.idempotency_key,
          is_offline: true,
          client_created_at: item.client_created_at,
          offline_receipt_no: item.offline_receipt_no,
          offline_client_total: item.offline_client_total,
        },
      };

      try {
        const res = await apiPost('pos/sales', payload);
        item.status = 'Synced';
        item.synced_at = new Date().toISOString();
        item.server_sale_invoice_no = res.sale_invoice_no;
        item.server_sales_number = res.sales_number;
        item.price_variance = res.price_variance;
        item.late_sync = res.late_sync;
        success++;
      } catch (err: any) {
        const status = err?.status;
        const errMsg = err?.message || 'Sync failed';

        if (status === 401) {
          // Cashier token expired/unauthorized: revert to Pending and halt sync immediately
          item.status = 'Pending';
          item.last_error = 'Authentication required. Please log in to complete sync.';
          haltedByAuth = true;
          break;
        }

        if (status && status >= 400 && status < 500) {
          // 4xx client rejection: mark Failed, increment retry count, do NOT auto-retry
          item.status = 'Failed';
          item.last_error = errMsg;
          item.retry_count = (item.retry_count || 0) + 1;
          failed++;
        } else {
          // 5xx temporary server error or network drop: revert to Pending, break loop
          item.status = 'Pending';
          item.last_error = `Server temporary error: ${errMsg}`;
          item.retry_count = (item.retry_count || 0) + 1;
          break;
        }
      }
    }

    return { success, failed, haltedByAuth };
  }
}

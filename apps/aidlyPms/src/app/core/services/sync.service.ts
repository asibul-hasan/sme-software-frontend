import { Injectable, inject, signal, effect } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { OfflineStoreService } from './offline-store.service';
import { ConnectivityService } from './connectivity.service';
import { NotificationService } from './notification.service';
import { SaleInvoice } from '../models/customer.models';
import { CreateSalePayload } from './pos-sale.service';
import { QueuedSale } from '../models/offline.models';
import { computeBackoffDelay, validateDiscardReason } from './offline-queue-manager';

@Injectable({
  providedIn: 'root',
})
export class SyncService {
  private readonly api = inject(ApiService);
  private readonly offlineStore = inject(OfflineStoreService);
  private readonly connectivity = inject(ConnectivityService);
  private readonly notification = inject(NotificationService);

  readonly isSyncing = signal<boolean>(false);
  readonly pendingCount = signal<number>(0);
  readonly failedCount = signal<number>(0);
  readonly syncedCount = signal<number>(0);
  readonly totalCount = signal<number>(0);
  readonly syncProgress = signal<{ current: number; total: number } | null>(null);

  constructor() {
    this.refreshCounts();

    // Auto-sync when coming back online
    effect(() => {
      const online = this.connectivity.isOnline();
      if (online && !this.isSyncing() && this.pendingCount() > 0) {
        this.syncPendingSales().catch(() => {});
      }
    });
  }

  async refreshCounts(): Promise<void> {
    try {
      const counts = await this.offlineStore.getQueueCounts();
      this.pendingCount.set(counts.pending);
      this.failedCount.set(counts.failed);
      this.syncedCount.set(counts.synced);
      this.totalCount.set(counts.total);
    } catch {}
  }

  async syncPendingSales(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing() || !this.connectivity.isOnline()) {
      return { success: 0, failed: 0 };
    }

    this.isSyncing.set(true);
    let successCount = 0;
    let failedCount = 0;

    try {
      const queue = await this.offlineStore.getPendingQueue();
      if (queue.length === 0) {
        await this.refreshCounts();
        return { success: 0, failed: 0 };
      }

      this.syncProgress.set({ current: 0, total: queue.length });

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        if (!this.connectivity.isOnline()) {
          // Connection dropped during sync loop
          break;
        }

        this.syncProgress.set({ current: i + 1, total: queue.length });
        await this.offlineStore.updateQueueItem(item.idempotency_key, { status: 'Syncing' });

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
          const res = await firstValueFrom(
            this.api.post<SaleInvoice>('pos/sales', payload, { silent: true })
          );

          if (res && res.data) {
            await this.offlineStore.updateQueueItem(item.idempotency_key, {
              status: 'Synced',
              synced_at: new Date().toISOString(),
              server_sale_invoice_no: res.data.sale_invoice_no,
              server_sales_number: res.data.sales_number,
              price_variance: res.data.price_variance,
              late_sync: res.data.late_sync,
            });

            await this.offlineStore.logSync({
              timestamp: new Date().toISOString(),
              level: 'info',
              message: `Offline sale ${item.offline_receipt_no} synced successfully -> Invoice ${res.data.sales_number}`,
            });

            successCount++;
          }
        } catch (err: any) {
          const status = err?.status;
          const errMsg = err?.error?.message || err?.message || 'Sync failed';

          if (status === 401) {
            // Cashier token expired or unauthorized -> Halt sync immediately so sales are not rejected
            await this.offlineStore.updateQueueItem(item.idempotency_key, {
              status: 'Pending',
              last_error: 'Authentication required. Please log in to complete sync.',
            });
            this.notification.warning('Authentication Required', 'Please log in again to sync pending offline sales.');
            break;
          }

          if (status && status >= 400 && status < 500) {
            // Client error (400 validation error, 409 conflict, etc.) -> Mark Failed
            await this.offlineStore.updateQueueItem(item.idempotency_key, {
              status: 'Failed',
              last_error: errMsg,
              retry_count: item.retry_count + 1,
            });
            await this.offlineStore.logSync({
              timestamp: new Date().toISOString(),
              level: 'error',
              message: `Offline sale ${item.offline_receipt_no} rejected by server (${status}): ${errMsg}`,
            });
            failedCount++;
          } else {
            // 5xx Server Error or network connection dropped -> Revert to Pending and break loop
            await this.offlineStore.updateQueueItem(item.idempotency_key, {
              status: 'Pending',
              last_error: `Server temporary error: ${errMsg}`,
              retry_count: item.retry_count + 1,
            });
            break;
          }
        }
      }
    } finally {
      this.isSyncing.set(false);
      this.syncProgress.set(null);
      await this.refreshCounts();
    }

    return { success: successCount, failed: failedCount };
  }

  computeBackoffDelay(retryCount: number): number {
    return computeBackoffDelay(retryCount);
  }

  async retrySale(idempotencyKey: string): Promise<boolean> {
    const item = await this.offlineStore.getQueueItem(idempotencyKey);
    if (!item) return false;

    await this.offlineStore.updateQueueItem(idempotencyKey, {
      status: 'Pending',
      last_error: undefined,
    });
    await this.refreshCounts();

    if (this.connectivity.isOnline()) {
      await this.syncPendingSales();
      return true;
    }
    return false;
  }

  async discardSale(idempotencyKey: string, reason: string): Promise<void> {
    const validReason = validateDiscardReason(reason);
    await this.offlineStore.discardSale(idempotencyKey, validReason);
    await this.offlineStore.logSync({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message: `Sale with key ${idempotencyKey} was discarded. Reason: ${validReason}`,
    });
    await this.refreshCounts();
  }
}

export { computeBackoffDelay } from './offline-queue-manager';

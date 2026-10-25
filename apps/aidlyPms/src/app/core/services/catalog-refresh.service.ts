import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { OfflineStoreService } from './offline-store.service';
import { ConnectivityService } from './connectivity.service';
import { PosCatalogSnapshotDto } from '../models/offline.models';

@Injectable({
  providedIn: 'root',
})
export class CatalogRefreshService {
  private readonly api = inject(ApiService);
  private readonly offlineStore = inject(OfflineStoreService);
  private readonly connectivity = inject(ConnectivityService);

  readonly isRefreshing = signal<boolean>(false);
  readonly lastRefreshTime = signal<Date | null>(null);
  readonly lastUpdateText = signal<string>('Catalog not updated yet');

  private intervalTimer: ReturnType<typeof setInterval> | null = null;
  private tickerTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.initSchedule();
  }

  private initSchedule(): void {
    if (typeof window === 'undefined') return;

    // Periodic refresh every 10 minutes when online
    this.intervalTimer = setInterval(() => {
      if (this.connectivity.isOnline()) {
        this.refreshCatalog(false).catch(() => {});
      }
    }, 10 * 60 * 1000);

    // Update relative time text every 30 seconds
    this.tickerTimer = setInterval(() => {
      this.updateRelativeText();
    }, 30 * 1000);

    // Initial check from cached metadata
    this.offlineStore.getLastSnapshotMeta().then(meta => {
      if (meta.last_snapshot_at) {
        this.lastRefreshTime.set(new Date(meta.last_snapshot_at));
        this.updateRelativeText();
      }
    }).catch(() => {});
  }

  async refreshCatalog(forceFull = false): Promise<boolean> {
    if (!this.connectivity.isOnline() || this.isRefreshing()) {
      return false;
    }

    this.isRefreshing.set(true);

    try {
      const meta = await this.offlineStore.getLastSnapshotMeta();
      const params: Record<string, unknown> = {
        pageSize: 2000,
      };

      if (!forceFull && meta.last_snapshot_at) {
        params['updated_after'] = meta.last_snapshot_at;
      }

      const res = await firstValueFrom(
        this.api.get<PosCatalogSnapshotDto>('pos/catalog-snapshot', { params, silent: true })
      );

      if (res && res.data) {
        await this.offlineStore.saveCatalogSnapshot(res.data);
        const refreshDate = new Date(res.data.server_time_utc || new Date().toISOString());
        this.lastRefreshTime.set(refreshDate);
        this.updateRelativeText();
        await this.offlineStore.logSync({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Catalog snapshot refreshed successfully (${res.data.products?.length || 0} products, ${res.data.batches?.length || 0} batches, ${res.data.customers?.length || 0} customers)`,
        });
        return true;
      }
      return false;
    } catch (err) {
      await this.offlineStore.logSync({
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: 'Failed to refresh catalog snapshot',
        details: err,
      });
      return false;
    } finally {
      this.isRefreshing.set(false);
    }
  }

  private updateRelativeText(): void {
    const time = this.lastRefreshTime();
    if (!time) {
      this.lastUpdateText.set('Catalog not updated yet');
      return;
    }

    const now = new Date();
    const diffSec = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffSec < 60) {
      this.lastUpdateText.set('Catalog updated just now');
    } else if (diffSec < 3600) {
      const mins = Math.floor(diffSec / 60);
      this.lastUpdateText.set(`Catalog updated ${mins}m ago`);
    } else {
      const hours = Math.floor(diffSec / 3600);
      this.lastUpdateText.set(`Catalog updated ${hours}h ago`);
    }
  }

  ngOnDestroy(): void {
    if (this.intervalTimer) clearInterval(this.intervalTimer);
    if (this.tickerTimer) clearInterval(this.tickerTimer);
  }
}

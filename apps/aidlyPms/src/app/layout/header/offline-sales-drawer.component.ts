import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { ConnectivityService } from '../../core/services/connectivity.service';
import { SyncService } from '../../core/services/sync.service';
import { CatalogRefreshService } from '../../core/services/catalog-refresh.service';
import { OfflineStoreService } from '../../core/services/offline-store.service';
import { QueuedSale } from '../../core/models/offline.models';

@Component({
  selector: 'app-offline-sales-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzModalModule,
    NzButtonModule,
    NzTagModule,
    NzTableModule,
    NzIconModule,
    NzTooltipModule,
  ],
  template: `
    <nz-modal
      [nzVisible]="visible"
      [nzTitle]="modalTitle"
      [nzFooter]="null"
      [nzWidth]="960"
      (nzOnCancel)="onClose()"
      nzCentered
    >
      <ng-template #modalTitle>
        <div class="flex items-center justify-between pr-6">
          <div class="flex items-center gap-2">
            <span nz-icon nzType="cloud-sync" class="text-indigo-600 text-lg"></span>
            <span class="font-bold text-slate-900 text-base">Offline Sales Queue & Sync Management</span>
          </div>
          <div class="flex items-center gap-2">
            @if (connectivity.isOnline()) {
              <nz-tag nzColor="success" class="m-0 flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Online</span>
              </nz-tag>
            } @else {
              <nz-tag nzColor="error" class="m-0 flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>Offline</span>
              </nz-tag>
            }
          </div>
        </div>
      </ng-template>

      <ng-container *nzModalContent>
        <!-- Top Metrics & Controls -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div class="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div class="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending Sync</div>
            <div class="text-2xl font-bold text-amber-900 mt-1">{{ syncService.pendingCount() }}</div>
          </div>
          <div class="p-3 rounded-lg bg-rose-50 border border-rose-200">
            <div class="text-xs font-semibold text-rose-700 uppercase tracking-wider">Sync Failed</div>
            <div class="text-2xl font-bold text-rose-900 mt-1">{{ syncService.failedCount() }}</div>
          </div>
          <div class="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <div class="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Synced</div>
            <div class="text-2xl font-bold text-emerald-900 mt-1">{{ syncService.syncedCount() }}</div>
          </div>
          <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div class="text-xs font-semibold text-slate-700 uppercase tracking-wider">Total Sales In Queue</div>
            <div class="text-2xl font-bold text-slate-900 mt-1">{{ syncService.totalCount() }}</div>
          </div>
        </div>

        <!-- Action Bar -->
        <div class="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg mb-4">
          <div class="flex items-center gap-3">
            <button
              nz-button
              nzType="primary"
              [nzLoading]="syncService.isSyncing()"
              [disabled]="!connectivity.isOnline() || syncService.pendingCount() === 0"
              (click)="triggerSync()"
              class="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700"
            >
              <span nz-icon nzType="sync"></span>
              <span>Sync All Pending Sales</span>
            </button>

            <button
              nz-button
              nzType="default"
              [nzLoading]="catalogRefresh.isRefreshing()"
              [disabled]="!connectivity.isOnline()"
              (click)="refreshCatalogNow()"
              class="flex items-center gap-1.5"
            >
              <span nz-icon nzType="reload"></span>
              <span>Refresh Catalog Snapshot</span>
            </button>
          </div>

          <div class="text-xs text-slate-500 flex items-center gap-1">
            <span nz-icon nzType="clock-circle"></span>
            <span>{{ catalogRefresh.lastUpdateText() }}</span>
          </div>
        </div>

        <!-- Sales Queue Table -->
        <div class="border border-slate-200 rounded-lg overflow-hidden">
          <nz-table
            #queueTable
            [nzData]="queueItems()"
            [nzSize]="'small'"
            [nzShowPagination]="true"
            [nzPageSize]="8"
          >
            <thead>
              <tr class="bg-slate-100 text-xs font-semibold text-slate-700">
                <th nzWidth="150px">Offline Receipt</th>
                <th nzWidth="140px">Created At</th>
                <th>Items & Total</th>
                <th nzWidth="110px">Status</th>
                <th nzWidth="180px">Server Sync Result</th>
                <th nzWidth="130px" nzAlign="center">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (item of queueTable.data; track item.idempotency_key) {
                <tr class="text-xs">
                  <td class="font-mono font-medium text-slate-900">
                    {{ item.offline_receipt_no }}
                  </td>
                  <td class="text-slate-600">
                    {{ item.client_created_at | date:'dd MMM yyyy, HH:mm' }}
                  </td>
                  <td>
                    <div class="font-medium text-slate-800">
                      {{ item.payload.items.length }} items · ৳ {{ item.offline_client_total | number:'1.2-2' }}
                    </div>
                    @if (item.payload.invoice.customer_name) {
                      <div class="text-[11px] text-slate-500 truncate max-w-[180px]">
                        Customer: {{ item.payload.invoice.customer_name }}
                      </div>
                    }
                  </td>
                  <td>
                    @switch (item.status) {
                      @case ('Pending') {
                        <nz-tag nzColor="warning">Pending</nz-tag>
                      }
                      @case ('Syncing') {
                        <nz-tag nzColor="processing">
                          <span nz-icon nzType="loading" class="mr-1"></span>
                          Syncing
                        </nz-tag>
                      }
                      @case ('Synced') {
                        <nz-tag nzColor="success">Synced</nz-tag>
                      }
                      @case ('Failed') {
                        <nz-tag nzColor="error" nz-tooltip [nzTooltipTitle]="item.last_error">
                          Failed
                        </nz-tag>
                      }
                      @case ('Discarded') {
                        <nz-tag nzColor="default">Discarded</nz-tag>
                      }
                    }
                  </td>
                  <td>
                    @if (item.status === 'Synced') {
                      <div class="font-mono font-semibold text-emerald-700">
                        {{ item.server_sales_number }}
                      </div>
                      <div class="flex items-center gap-1.5 mt-0.5">
                        @if (item.late_sync) {
                          <nz-tag nzColor="purple" class="text-[10px] m-0 py-0 px-1">Late Sync</nz-tag>
                        }
                        @if (item.price_variance && item.price_variance !== 0) {
                          <span class="text-[11px] text-amber-600 font-medium">
                            Var: ৳ {{ item.price_variance > 0 ? '+' : '' }}{{ item.price_variance | number:'1.2-2' }}
                          </span>
                        }
                      </div>
                    } @else if (item.status === 'Failed') {
                      <div class="text-rose-600 text-[11px] truncate max-w-[200px]" [title]="item.last_error">
                        {{ item.last_error || 'Error during sync' }}
                      </div>
                    } @else {
                      <span class="text-slate-400 italic">Awaiting connection</span>
                    }
                  </td>
                  <td nzAlign="center">
                    <div class="flex items-center justify-center gap-1">
                      @if (item.status === 'Failed') {
                        <button
                          nz-button
                          nzType="link"
                          nzSize="small"
                          (click)="retrySale(item.idempotency_key)"
                          class="text-indigo-600 px-1"
                        >
                          Retry
                        </button>
                      }
                      @if (item.status === 'Pending' || item.status === 'Failed') {
                        <button
                          nz-button
                          nzType="link"
                          nzDanger
                          nzSize="small"
                          (click)="confirmDiscard(item)"
                          class="px-1"
                        >
                          Discard
                        </button>
                      }
                      <button
                        nz-button
                        nzType="text"
                        nzSize="small"
                        (click)="inspectSale(item)"
                        class="text-slate-600 px-1"
                        title="View details"
                      >
                        <span nz-icon nzType="eye"></span>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </nz-table>
        </div>
      </ng-container>
    </nz-modal>

    <!-- Details Modal -->
    <nz-modal
      [nzVisible]="detailsVisible"
      nzTitle="Offline Sale Details"
      [nzFooter]="null"
      [nzWidth]="640"
      (nzOnCancel)="detailsVisible = false"
    >
      <ng-container *nzModalContent>
        @if (selectedItem) {
          <div class="space-y-3 text-xs">
            <div class="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200">
              <div><span class="text-slate-500">Receipt No:</span> <strong class="font-mono">{{ selectedItem.offline_receipt_no }}</strong></div>
              <div><span class="text-slate-500">Status:</span> <strong>{{ selectedItem.status }}</strong></div>
              <div><span class="text-slate-500">Created:</span> {{ selectedItem.client_created_at | date:'medium' }}</div>
              <div><span class="text-slate-500">Total:</span> <strong>৳ {{ selectedItem.offline_client_total | number:'1.2-2' }}</strong></div>
            </div>

            <div class="font-semibold text-slate-800">Line Items:</div>
            <div class="border border-slate-200 rounded max-h-48 overflow-y-auto">
              <table class="w-full text-left">
                <thead class="bg-slate-100 text-slate-600">
                  <tr>
                    <th class="p-1.5">Product</th>
                    <th class="p-1.5 text-right">Qty</th>
                    <th class="p-1.5 text-right">Price</th>
                    <th class="p-1.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  @for (line of selectedItem.payload.items; track line.product_no) {
                    <tr class="border-t border-slate-100">
                      <td class="p-1.5">{{ line.product_name || ('Product #' + line.product_no) }}</td>
                      <td class="p-1.5 text-right">{{ line.sale_qty }}</td>
                      <td class="p-1.5 text-right font-mono">৳ {{ (line.unit_sale_price || 0) | number:'1.2-2' }}</td>
                      <td class="p-1.5 text-right font-mono">৳ {{ line.total_price | number:'1.2-2' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            @if (selectedItem.last_error) {
              <div class="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700">
                <strong>Sync Error:</strong> {{ selectedItem.last_error }}
              </div>
            }
          </div>
        }
      </ng-container>
    </nz-modal>
  `,
})
export class OfflineSalesDrawerComponent implements OnInit {
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();

  readonly connectivity = inject(ConnectivityService);
  readonly syncService = inject(SyncService);
  readonly catalogRefresh = inject(CatalogRefreshService);
  private readonly offlineStore = inject(OfflineStoreService);
  private readonly msg = inject(NzMessageService);

  readonly queueItems = signal<QueuedSale[]>([]);
  detailsVisible = false;
  selectedItem: QueuedSale | null = null;

  async ngOnInit(): Promise<void> {
    await this.loadQueue();
  }

  async loadQueue(): Promise<void> {
    try {
      const items = await this.offlineStore.getAllQueue();
      this.queueItems.set(items);
      await this.syncService.refreshCounts();
    } catch {}
  }

  async triggerSync(): Promise<void> {
    const res = await this.syncService.syncPendingSales();
    await this.loadQueue();
    if (res.success > 0) {
      this.msg.success(`${res.success} offline sale(s) synced successfully!`);
    }
    if (res.failed > 0) {
      this.msg.error(`${res.failed} offline sale(s) failed to sync. Check error details.`);
    }
  }

  async refreshCatalogNow(): Promise<void> {
    const ok = await this.catalogRefresh.refreshCatalog(true);
    if (ok) {
      this.msg.success('Catalog snapshot updated successfully!');
    } else {
      this.msg.warning('Could not refresh catalog. Check your internet connection.');
    }
  }

  async retrySale(idempotencyKey: string): Promise<void> {
    await this.syncService.retrySale(idempotencyKey);
    await this.loadQueue();
    this.msg.info('Sale queued for retry.');
  }

  async confirmDiscard(item: QueuedSale): Promise<void> {
    const reason = prompt(`Are you sure you want to discard offline sale ${item.offline_receipt_no}? Enter reason:`);
    if (reason && reason.trim()) {
      await this.syncService.discardSale(item.idempotency_key, reason.trim());
      await this.loadQueue();
      this.msg.warning(`Offline sale ${item.offline_receipt_no} discarded.`);
    }
  }

  inspectSale(item: QueuedSale): void {
    this.selectedItem = item;
    this.detailsVisible = true;
  }

  onClose(): void {
    this.close.emit();
  }
}

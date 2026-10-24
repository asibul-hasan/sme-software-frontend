import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzAlertModule } from 'ng-zorro-antd/alert';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StocktakeService } from '../../core/services/stocktake.service';
import { InvStocktake, InvStocktakeItem, StocktakeCountItem } from '../../core/models/inventory.models';

interface EditableStocktakeItem extends InvStocktakeItem {
  editable_counted_qty?: number | null;
  editable_reason?: string;
}

@Component({
  selector: 'app-stocktake-count',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzTagModule,
    NzTooltipModule,
    NzSpinModule,
    NzModalModule,
    NzAlertModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        [title]="'Stock-take Audit #' + stocktakeNo()"
        [subtitle]="'Status: ' + (stocktake()?.status || 'Loading') + ' · Started: ' + (stocktake()?.started_at | date: 'dd/MM/yyyy HH:mm')"
        formId="PROD_1612"
        [breadcrumbs]="[
          { label: 'Medicines & Stock', url: '/products/list' },
          { label: 'Stock-take Audits', url: '/products/stocktakes' },
          { label: '#' + stocktakeNo() }
        ]"
      >
        <div filters class="flex items-center gap-2 shrink-0">
          <nz-input-group [nzPrefix]="searchPrefix" class="w-64">
            <input
              type="text"
              nz-input
              [(ngModel)]="searchQuery"
              placeholder="Search medicine or batch..."
              class="text-xs rounded-md"
            />
          </nz-input-group>
          <ng-template #searchPrefix>
            <span nz-icon nzType="search" class="text-slate-400"></span>
          </ng-template>
        </div>

        <div actions class="flex items-center gap-2 shrink-0">
          @if (isEditable()) {
            <button
              type="button"
              nz-button
              nzType="default"
              class="rounded-md h-8 px-3 text-xs font-semibold inline-flex items-center gap-1.5"
              [nzLoading]="isSaving()"
              (click)="saveCounts(false)"
            >
              <span nz-icon nzType="save"></span>
              Save Progress
            </button>

            <button
              type="button"
              nz-button
              nzType="default"
              class="rounded-md h-8 px-3 text-xs font-semibold inline-flex items-center gap-1.5 border-amber-300 text-amber-800 bg-amber-50"
              (click)="confirmRefreshSnapshot()"
            >
              <span nz-icon nzType="sync"></span>
              Refresh Snapshot
            </button>

            <button
              type="button"
              nz-button
              nzType="primary"
              class="rounded-md h-8 px-4 text-xs font-semibold inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 border-emerald-600"
              [nzLoading]="isPosting()"
              (click)="promptPostStocktake()"
            >
              <span nz-icon nzType="check"></span>
              Post & Adjust Stock
            </button>
          } @else {
            <span class="text-xs px-2.5 py-1 rounded-md font-semibold" [ngClass]="stocktake()?.status === 'Posted' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'">
              Audit {{ stocktake()?.status }}
            </span>
          }
        </div>
      </app-page-header>

      <!-- Alert for Changed Batches Conflict -->
      @if (conflictBatches().length > 0) {
        <nz-alert
          nzType="error"
          nzShowIcon
          [nzMessage]="'Snapshot Outdated Conflict (' + conflictBatches().length + ' batches)'"
          [nzDescription]="conflictAlertTpl"
          class="rounded-lg shadow-xs"
        ></nz-alert>
        <ng-template #conflictAlertTpl>
          <div class="text-xs space-y-1">
            <p class="m-0">
              The following batches were sold or altered while you were counting. System rules block posting until the count snapshot is refreshed:
            </p>
            <ul class="list-disc pl-5 m-0">
              @for (b of conflictBatches(); track b.batch_no) {
                <li>
                  <strong>{{ b.product_name }}</strong> (Batch: {{ b.batch_number }}): Snapshot was {{ b.snapshot_qty }} pcs, but current stock is {{ b.current_qty }} pcs.
                </li>
              }
            </ul>
            <div class="pt-2">
              <button
                type="button"
                nz-button
                nzSize="small"
                nzType="primary"
                nzDanger
                (click)="refreshSnapshotNow()"
              >
                Refresh Snapshot Now
              </button>
            </div>
          </div>
        </ng-template>
      }

      <!-- Progress & Variance Header Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs text-xs">
        <div>
          <span class="text-slate-500 block">Total Items in Scope</span>
          <strong class="text-base font-bold text-slate-800">{{ items().length }}</strong>
        </div>
        <div>
          <span class="text-slate-500 block">Items Counted</span>
          <strong class="text-base font-bold text-indigo-600">{{ countedCount() }} / {{ items().length }}</strong>
        </div>
        <div>
          <span class="text-slate-500 block">Variance Count</span>
          <strong class="text-base font-bold" [ngClass]="varianceItemCount() > 0 ? 'text-rose-600' : 'text-emerald-600'">
            {{ varianceItemCount() }} item(s)
          </strong>
        </div>
        <div>
          <span class="text-slate-500 block">Audit Progress</span>
          <div class="flex items-center gap-2 mt-1">
            <div class="w-full bg-slate-100 rounded-full h-2">
              <div
                class="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                [style.width.%]="items().length > 0 ? (countedCount() / items().length) * 100 : 0"
              ></div>
            </div>
            <span class="font-semibold text-slate-700">{{ items().length > 0 ? Math.round((countedCount() / items().length) * 100) : 0 }}%</span>
          </div>
        </div>
      </div>

      <!-- Main Count Grid -->
      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <nz-spin [nzSpinning]="isLoading()" class="flex-1 min-h-0 flex flex-col w-full">
          <div class="flex-1 min-h-0 overflow-auto w-full">
            <table class="w-full text-sm text-left border-collapse min-w-[900px]">
              <thead class="sticky top-0 z-10 bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200 shadow-xs">
                <tr>
                  <th class="p-3">Medicine & Generic</th>
                  <th class="p-3">Batch & Expiry</th>
                  <th class="p-3 text-right">System Qty (pcs)</th>
                  <th class="p-3 text-right w-36">Physical Count (pcs)</th>
                  <th class="p-3 text-right w-28">Variance</th>
                  <th class="p-3 w-64">Variance Reason</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-800">
                @for (item of filteredItems(); track item.stocktake_item_no) {
                  <tr
                    class="hover:bg-slate-50/70 transition-colors"
                    [class.bg-rose-50/40]="calculateVariance(item) !== 0 && item.editable_counted_qty !== null && item.editable_counted_qty !== undefined"
                  >
                    <td class="p-3">
                      <div class="font-semibold text-slate-900">{{ item.product_name }}</div>
                      @if (item.generic_name) {
                        <div class="text-[11px] text-slate-500">{{ item.generic_name }}</div>
                      }
                      @if (item.company_name) {
                        <div class="text-[11px] text-slate-400">{{ item.company_name }}</div>
                      }
                    </td>
                    <td class="p-3 text-xs">
                      <div class="font-mono font-medium text-slate-800">{{ item.batch_number || 'Default' }}</div>
                      <div class="text-slate-500">{{ item.expiry_date | date: 'dd/MM/yyyy' }}</div>
                    </td>
                    <td class="p-3 text-right font-mono font-semibold text-slate-700">
                      {{ item.system_qty_pcs }}
                    </td>
                    <td class="p-3 text-right">
                      @if (isEditable()) {
                        <input
                          type="number"
                          nz-input
                          [(ngModel)]="item.editable_counted_qty"
                          (ngModelChange)="onCountChanged(item)"
                          placeholder="Count"
                          class="w-28 text-right font-mono text-xs rounded-md"
                          min="0"
                        />
                      } @else {
                        <span class="font-mono font-semibold">{{ item.counted_qty_pcs ?? '-' }}</span>
                      }
                    </td>
                    <td class="p-3 text-right font-mono text-xs font-semibold">
                      @if (item.editable_counted_qty !== null && item.editable_counted_qty !== undefined) {
                        @let diff = calculateVariance(item);
                        <span [ngClass]="diff === 0 ? 'text-slate-400' : diff > 0 ? 'text-emerald-600' : 'text-rose-600'">
                          {{ diff > 0 ? '+' + diff : diff }}
                        </span>
                      } @else {
                        <span class="text-slate-300">-</span>
                      }
                    </td>
                    <td class="p-3">
                      @if (isEditable()) {
                        @if (calculateVariance(item) !== 0 && item.editable_counted_qty !== null && item.editable_counted_qty !== undefined) {
                          <input
                            type="text"
                            nz-input
                            [(ngModel)]="item.editable_reason"
                            placeholder="Mandatory reason..."
                            class="text-xs rounded-md"
                            [class.border-rose-400]="!item.editable_reason?.trim()"
                          />
                        } @else {
                          <span class="text-xs text-slate-300 italic">No variance</span>
                        }
                      } @else {
                        <span class="text-xs text-slate-600">{{ item.reason || '-' }}</span>
                      }
                    </td>
                  </tr>
                } @empty {
                  @if (!isLoading()) {
                    <tr>
                      <td colspan="6" class="p-8 text-center text-slate-400">
                        No snapshot items found matching your search.
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </nz-spin>
      </div>
    </div>
  `,
})
export class StocktakeCountComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly stocktakeService = inject(StocktakeService);
  private readonly messageService = inject(NzMessageService);
  private readonly modalService = inject(NzModalService);
  private readonly router = inject(Router);

  readonly Math = Math;
  stocktakeNo = signal<number>(0);
  stocktake = signal<InvStocktake | null>(null);
  items = signal<EditableStocktakeItem[]>([]);
  conflictBatches = signal<any[]>([]);

  isLoading = signal(false);
  isSaving = signal(false);
  isPosting = signal(false);
  searchQuery = '';

  isEditable = computed(() => {
    const s = this.stocktake()?.status;
    return s === 'Open' || s === 'Counting';
  });

  countedCount = computed(() => {
    return this.items().filter((i) => i.editable_counted_qty !== null && i.editable_counted_qty !== undefined).length;
  });

  varianceItemCount = computed(() => {
    return this.items().filter((i) => {
      if (i.editable_counted_qty === null || i.editable_counted_qty === undefined) return false;
      return this.calculateVariance(i) !== 0;
    }).length;
  });

  filteredItems = computed(() => {
    const q = this.searchQuery.trim().toLowerCase();
    const list = this.items();
    if (!q) return list;
    return list.filter(
      (i) =>
        i.product_name?.toLowerCase().includes(q) ||
        i.generic_name?.toLowerCase().includes(q) ||
        i.batch_number?.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.stocktakeNo.set(id);
      this.loadStocktake();
    }
  }

  loadStocktake(): void {
    this.isLoading.set(true);
    this.stocktakeService.getStocktake(this.stocktakeNo()).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.stocktake.set(res.data);
          const rawItems = (res.data.items || []) as EditableStocktakeItem[];
          // Populate editable models
          rawItems.forEach((item) => {
            item.editable_counted_qty = item.counted_qty_pcs ?? null;
            item.editable_reason = item.reason ?? '';
          });
          this.items.set(rawItems);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.messageService.error('Failed to load stock-take details.');
      },
    });
  }

  calculateVariance(item: EditableStocktakeItem): number {
    if (item.editable_counted_qty === null || item.editable_counted_qty === undefined) return 0;
    return Number(item.editable_counted_qty) - Number(item.system_qty_pcs);
  }

  onCountChanged(item: EditableStocktakeItem): void {
    // If variance is 0, clear reason
    if (this.calculateVariance(item) === 0) {
      item.editable_reason = '';
    }
  }

  saveCounts(silent = false): void {
    const countItems: StocktakeCountItem[] = this.items()
      .filter((i) => i.editable_counted_qty !== null && i.editable_counted_qty !== undefined)
      .map((i) => ({
        stocktake_item_no: i.stocktake_item_no,
        counted_qty_pcs: Number(i.editable_counted_qty),
        reason: i.editable_reason?.trim() || null,
      }));

    if (countItems.length === 0) {
      if (!silent) this.messageService.info('No counted items to save.');
      return;
    }

    this.isSaving.set(true);
    this.stocktakeService.saveCounts(this.stocktakeNo(), { items: countItems }).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (!silent) this.messageService.success('Count progress saved.');
        if (res.data) {
          this.stocktake.set(res.data);
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        if (!silent) this.messageService.error(err.error?.message || 'Failed to save counts.');
      },
    });
  }

  confirmRefreshSnapshot(): void {
    this.modalService.confirm({
      nzTitle: 'Refresh Count Snapshot?',
      nzContent: 'This will re-synchronize system quantities with any recent sales or purchases, preserving your counted entries.',
      nzOkText: 'Refresh Snapshot',
      nzOnOk: () => this.refreshSnapshotNow(),
    });
  }

  refreshSnapshotNow(): void {
    this.isLoading.set(true);
    this.stocktakeService.refreshSnapshot(this.stocktakeNo()).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.conflictBatches.set([]);
        this.messageService.success('Snapshot successfully refreshed with current live inventory.');
        this.loadStocktake();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.messageService.error(err.error?.message || 'Failed to refresh snapshot.');
      },
    });
  }

  promptPostStocktake(): void {
    // Check if any item has variance but no reason
    const invalidItems = this.items().filter((i) => {
      if (i.editable_counted_qty === null || i.editable_counted_qty === undefined) return false;
      const v = this.calculateVariance(i);
      return v !== 0 && !i.editable_reason?.trim();
    });

    if (invalidItems.length > 0) {
      this.messageService.error(
        `Reason is required for all items with variance (${invalidItems.length} missing reason).`
      );
      return;
    }

    this.modalService.confirm({
      nzTitle: `Post Stock-take #${this.stocktakeNo()}?`,
      nzContent: `This will permanently post stock adjustments for ${this.varianceItemCount()} item(s) with variance. This action cannot be undone.`,
      nzOkText: 'Confirm & Adjust Stock',
      nzOkType: 'primary',
      nzOnOk: () => this.executePost(),
    });
  }

  private executePost(): void {
    const payloadItems: StocktakeCountItem[] = this.items()
      .filter((i) => i.editable_counted_qty !== null && i.editable_counted_qty !== undefined)
      .map((i) => ({
        stocktake_item_no: i.stocktake_item_no,
        counted_qty_pcs: Number(i.editable_counted_qty),
        reason: i.editable_reason?.trim() || 'Physical inventory count reconciliation',
      }));

    this.isPosting.set(true);
    this.stocktakeService.postStocktake(this.stocktakeNo(), { items: payloadItems }).subscribe({
      next: (res) => {
        this.isPosting.set(false);
        this.messageService.success('Stock-take posted successfully! Stock levels adjusted.');
        this.conflictBatches.set([]);
        this.loadStocktake();
      },
      error: (err) => {
        this.isPosting.set(false);
        if (err.error?.data && Array.isArray(err.error.data)) {
          // Changed batches conflict
          this.conflictBatches.set(err.error.data);
          this.messageService.error('Conflict: Some batches changed since the snapshot. Please refresh snapshot.');
        } else {
          this.messageService.error(err.error?.message || 'Failed to post stock-take.');
        }
      },
    });
  }
}

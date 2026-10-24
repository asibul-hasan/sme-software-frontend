import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StocktakeService } from '../../core/services/stocktake.service';
import { InvStocktake } from '../../core/models/inventory.models';

@Component({
  selector: 'app-stocktake-list',
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
    NzPaginationModule,
    NzModalModule,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Stock-take & Physical Inventory Audits"
        subtitle="Manage periodic stock counts, reconcile system snapshots with shelf physicals, and post adjustments"
        formId="PROD_1612"
        [breadcrumbs]="[
          { label: 'Medicines & Stock', url: '/products/list' },
          { label: 'Stock-take (Cycle Count)' }
        ]"
      >
        <div actions class="flex items-center gap-2 shrink-0">
          <a
            routerLink="/products/integrity"
            nz-button
            nzType="default"
            class="rounded-md h-8 px-3 text-xs font-semibold inline-flex items-center gap-1.5 border-slate-300"
          >
            <span nz-icon nzType="safety-certificate" class="text-emerald-600"></span>
            Ledger Integrity
          </a>
          <a
            routerLink="/products/stocktakes/new"
            nz-button
            nzType="primary"
            class="rounded-md h-8 px-3 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <span nz-icon nzType="plus"></span>
            New Stock-take
          </a>
        </div>
      </app-page-header>

      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <nz-spin [nzSpinning]="isLoading()" class="flex-1 min-h-0 flex flex-col w-full">
          <div class="flex-1 min-h-0 overflow-auto w-full">
            <table class="w-full text-sm text-left border-collapse min-w-[850px]">
              <thead class="sticky top-0 z-10 bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200 shadow-xs">
                <tr>
                  <th class="p-3">Audit #</th>
                  <th class="p-3">Started</th>
                  <th class="p-3">Scope / Scope Note</th>
                  <th class="p-3 text-center">Status</th>
                  <th class="p-3 text-right">Total Items</th>
                  <th class="p-3 text-right">Counted</th>
                  <th class="p-3">Posted By / At</th>
                  <th class="p-3 text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-800">
                @for (st of stocktakes(); track st.stocktake_no) {
                  <tr class="hover:bg-slate-50/70 transition-colors">
                    <td class="p-3 font-semibold text-slate-900">
                      #{{ st.stocktake_no }}
                    </td>
                    <td class="p-3 text-xs text-slate-600">
                      <div>{{ st.started_at | date: 'dd/MM/yyyy HH:mm' }}</div>
                      @if (st.started_by_name) {
                        <div class="text-[11px] text-slate-400">By: {{ st.started_by_name }}</div>
                      }
                    </td>
                    <td class="p-3 text-xs text-slate-700">
                      <span class="font-medium">{{ st.note || 'General Audit' }}</span>
                    </td>
                    <td class="p-3 text-center">
                      <span
                        class="px-2 py-0.5 rounded-full text-xs font-medium inline-block"
                        [ngClass]="getStatusBadgeClass(st.status)"
                      >
                        {{ st.status }}
                      </span>
                    </td>
                    <td class="p-3 text-right text-xs font-mono font-medium text-slate-700">
                      {{ st.total_items ?? '-' }}
                    </td>
                    <td class="p-3 text-right text-xs font-mono font-medium">
                      <span [ngClass]="(st.total_counted ?? 0) === (st.total_items ?? 0) ? 'text-emerald-600' : 'text-amber-600'">
                        {{ st.total_counted ?? 0 }} / {{ st.total_items ?? '-' }}
                      </span>
                    </td>
                    <td class="p-3 text-xs text-slate-500">
                      @if (st.posted_at) {
                        <div class="text-slate-800">{{ st.posted_at | date: 'dd/MM/yyyy HH:mm' }}</div>
                        @if (st.posted_by_name) {
                          <div class="text-[11px] text-slate-400">By: {{ st.posted_by_name }}</div>
                        }
                      } @else {
                        <span class="text-slate-400 italic">Not posted</span>
                      }
                    </td>
                    <td class="p-3 text-center">
                      <div class="flex items-center justify-center gap-1.5">
                        @if (st.status === 'Open' || st.status === 'Counting') {
                          <a
                            [routerLink]="['/products/stocktakes', st.stocktake_no]"
                            nz-button
                            nzSize="small"
                            nzType="primary"
                            class="rounded text-xs font-medium"
                          >
                            <span nz-icon nzType="edit"></span> Count
                          </a>
                          <button
                            type="button"
                            nz-button
                            nzSize="small"
                            nzDanger
                            class="rounded text-xs"
                            (click)="confirmCancel(st)"
                          >
                            <span nz-icon nzType="close"></span>
                          </button>
                        } @else {
                          <a
                            [routerLink]="['/products/stocktakes', st.stocktake_no]"
                            nz-button
                            nzSize="small"
                            nzType="default"
                            class="rounded text-xs font-medium text-slate-600"
                          >
                            <span nz-icon nzType="eye"></span> View
                          </a>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  @if (!isLoading()) {
                    <tr>
                      <td colspan="8" class="p-8 text-center">
                        <app-empty-state
                          title="No Stock-take Audits Found"
                          description="Initiate a periodic physical stock count or cycle audit to reconcile your shelf quantities."
                          ctaText="Start First Stock-take"
                          (action)="router.navigate(['/products/stocktakes/new'])"
                        ></app-empty-state>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination Footer -->
          @if (totalRecords() > pageSize) {
            <div class="p-3 border-t border-slate-100 flex justify-end">
              <nz-pagination
                [nzPageIndex]="pageIndex"
                [nzPageSize]="pageSize"
                [nzTotal]="totalRecords()"
                (nzPageIndexChange)="onPageChange($event)"
                nzShowSizeChanger="false"
              ></nz-pagination>
            </div>
          }
        </nz-spin>
      </div>
    </div>
  `,
})
export class StocktakeListComponent implements OnInit {
  private readonly stocktakeService = inject(StocktakeService);
  private readonly modalService = inject(NzModalService);
  private readonly messageService = inject(NzMessageService);
  readonly router = inject(Router);

  stocktakes = signal<InvStocktake[]>([]);
  isLoading = signal(false);
  pageIndex = 1;
  pageSize = 20;
  totalRecords = signal(0);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.stocktakeService.getStocktakes({ pageNumber: this.pageIndex, pageSize: this.pageSize }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.stocktakes.set([...(res.data.items || [])]);
          this.totalRecords.set(res.data.total || 0);
        } else {
          this.stocktakes.set([]);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.messageService.error('Failed to load stock-takes.');
      },
    });
  }

  onPageChange(page: number): void {
    this.pageIndex = page;
    this.loadData();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Open':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Counting':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Posted':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Cancelled':
        return 'bg-slate-100 text-slate-500 border border-slate-200';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  }

  confirmCancel(st: InvStocktake): void {
    this.modalService.confirm({
      nzTitle: `Cancel Stock-take #${st.stocktake_no}?`,
      nzContent: 'Are you sure you want to cancel this count? Any unposted count values will be discarded.',
      nzOkText: 'Yes, Cancel Audit',
      nzOkDanger: true,
      nzOnOk: () => {
        this.stocktakeService.cancelStocktake(st.stocktake_no).subscribe({
          next: () => {
            this.messageService.success(`Stock-take #${st.stocktake_no} cancelled.`);
            this.loadData();
          },
          error: (err) => {
            this.messageService.error(err.error?.message || 'Failed to cancel stock-take.');
          },
        });
      },
    });
  }
}

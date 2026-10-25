import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ApiService } from '../../core/services/api.service';
import { SaleInvoice } from '../../core/models/customer.models';
import { PagedResult } from '../../core/models/common.models';

@Component({
  selector: 'app-offline-sales-review',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzTableModule,
    NzButtonModule,
    NzDatePickerModule,
    NzTagModule,
    NzIconModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Offline Sales Review"
        subtitle="Review synced offline transactions flagged with price variances or booked after shift close"
        formId="SALE_1411"
        [breadcrumbs]="[{ label: 'Sales', url: '/customer/sales' }, { label: 'Offline Sales Review' }]"
      >
        <div actions class="flex items-center gap-2">
          <button
            nz-button
            nzType="default"
            class="rounded-md"
            (click)="loadOfflineSales()"
            [nzLoading]="isLoading()"
          >
            <span nz-icon nzType="reload"></span> Refresh
          </button>
        </div>
      </app-page-header>

      <!-- Date Filters & Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 shrink-0">
        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs font-medium text-slate-500 block mb-0.5">Flagged Offline Invoices</span>
          <p class="text-xl font-bold text-slate-900 font-mono mb-0">{{ totalRecords() }}</p>
          <span class="text-[11px] text-slate-400">Total offline sales with variances or late sync</span>
        </div>

        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs font-medium text-slate-500 block mb-0.5">Late Synced Invoices</span>
          <p class="text-xl font-bold text-purple-700 font-mono mb-0">{{ lateSyncCount() }}</p>
          <span class="text-[11px] text-slate-400">Sales received after shift was closed</span>
        </div>

        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs font-medium text-slate-500 block mb-0.5">Total Price Variance</span>
          <p class="text-xl font-bold font-mono mb-0" [ngClass]="netVariance() >= 0 ? 'text-amber-600' : 'text-rose-600'">
            ৳ {{ netVariance() | number:'1.2-2' }}
          </p>
          <span class="text-[11px] text-slate-400">Net discrepancy between client and server total</span>
        </div>

        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div class="space-y-1 w-full">
            <span class="text-xs font-medium text-slate-500 block">Date Range Filter</span>
            <div class="flex items-center gap-2">
              <nz-range-picker
                [(ngModel)]="dateRange"
                (ngModelChange)="onDateChange()"
                nzFormat="dd-MM-yyyy"
                class="w-full text-xs"
              ></nz-range-picker>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Invoices Table -->
      <div class="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        <nz-table
          #offlineTable
          [nzData]="sales()"
          [nzLoading]="isLoading()"
          [nzTotal]="totalRecords()"
          [nzPageIndex]="pageIndex"
          [nzPageSize]="pageSize"
          [nzFrontPagination]="false"
          (nzPageIndexChange)="onPageIndexChange($event)"
          [nzScroll]="{ y: 'calc(100vh - 360px)' }"
          [nzSize]="'small'"
          class="flex-1"
        >
          <thead>
            <tr class="bg-slate-50 text-xs font-semibold text-slate-700">
              <th nzWidth="150px">Server Invoice</th>
              <th nzWidth="160px">Offline Receipt</th>
              <th nzWidth="150px">Client Timestamp</th>
              <th>Customer</th>
              <th nzWidth="120px" nzAlign="right">Client Total</th>
              <th nzWidth="120px" nzAlign="right">Server Total</th>
              <th nzWidth="120px" nzAlign="right">Variance</th>
              <th nzWidth="110px" nzAlign="center">Shift Status</th>
            </tr>
          </thead>
          <tbody>
            @for (item of offlineTable.data; track item.sale_invoice_no) {
              <tr class="text-xs hover:bg-slate-50/70 transition-colors">
                <td class="font-mono font-bold text-indigo-700">
                  <a [routerLink]="['/customer/sales']" [queryParams]="{ search: item.sales_number }">
                    {{ item.sales_number }}
                  </a>
                </td>
                <td class="font-mono font-medium text-slate-800">
                  {{ item.offline_receipt_no || 'N/A' }}
                </td>
                <td class="text-slate-600">
                  {{ (item.client_created_at || item.sale_timestamp) | date:'dd MMM yyyy, HH:mm' }}
                </td>
                <td class="text-slate-700 font-medium">
                  {{ item.customer_name || 'Walk-in Customer' }}
                </td>
                <td nzAlign="right" class="font-mono text-slate-700">
                  ৳ {{ (item.offline_client_total || 0) | number:'1.2-2' }}
                </td>
                <td nzAlign="right" class="font-mono font-semibold text-slate-900">
                  ৳ {{ item.final_price | number:'1.2-2' }}
                </td>
                <td nzAlign="right" class="font-mono font-bold">
                  @if (item.price_variance && item.price_variance !== 0) {
                    <span [ngClass]="item.price_variance > 0 ? 'text-amber-600' : 'text-rose-600'">
                      {{ item.price_variance > 0 ? '+' : '' }}৳ {{ item.price_variance | number:'1.2-2' }}
                    </span>
                  } @else {
                    <span class="text-slate-400 font-normal">৳ 0.00</span>
                  }
                </td>
                <td nzAlign="center">
                  @if (item.late_sync) {
                    <nz-tag nzColor="purple" class="font-semibold text-[11px] m-0">Late Sync</nz-tag>
                  } @else {
                    <nz-tag nzColor="success" class="text-[11px] m-0">On-Time</nz-tag>
                  }
                </td>
              </tr>
            }
          </tbody>
        </nz-table>
      </div>
    </div>
  `,
})
export class OfflineSalesReviewComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly msg = inject(NzMessageService);

  readonly sales = signal<SaleInvoice[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly totalRecords = signal<number>(0);
  readonly lateSyncCount = signal<number>(0);
  readonly netVariance = signal<number>(0);

  dateRange: Date[] = [];
  pageIndex = 1;
  pageSize = 20;

  ngOnInit(): void {
    this.loadOfflineSales();
  }

  loadOfflineSales(): void {
    this.isLoading.set(true);

    const params: Record<string, unknown> = {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
    };

    if (this.dateRange && this.dateRange.length === 2) {
      params['startDate'] = this.dateRange[0].toISOString();
      params['endDate'] = this.dateRange[1].toISOString();
    }

    this.api.getPaged<SaleInvoice>('pos/offline-sales', params).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.data) {
          const items = res.data.items || [];
          this.sales.set([...items]);
          this.totalRecords.set(res.data.total || 0);

          let lateCount = 0;
          let varianceSum = 0;
          for (const s of items) {
            if (s.late_sync) lateCount++;
            if (s.price_variance) varianceSum += Number(s.price_variance);
          }
          this.lateSyncCount.set(lateCount);
          this.netVariance.set(Math.round(varianceSum * 100) / 100);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.msg.error(err?.error?.message || 'Failed to load offline sales');
      },
    });
  }

  onDateChange(): void {
    this.pageIndex = 1;
    this.loadOfflineSales();
  }

  onPageIndexChange(page: number): void {
    this.pageIndex = page;
    this.loadOfflineSales();
  }
}

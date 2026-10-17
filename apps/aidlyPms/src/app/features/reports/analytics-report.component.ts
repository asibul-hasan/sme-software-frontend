import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { DashboardService, FastMovingProduct } from '../../core/services/dashboard.service';
import { formatDateToDdMmYyyy } from '../../shared/utils/date-range.util';

type DatePreset = 'today' | 'week' | 'month' | 'custom';

@Component({
  selector: 'app-analytics-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzTagModule,
    NzTooltipModule,
    NzSpinModule,
    NzDatePickerModule,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <!-- Page Header -->
      <app-page-header
        title="Sales Performance & Fast Movers"
        subtitle="Top fast-moving products, high-margin inventory, revenue breakdown, and sales analytics"
        formId="DASH_2302"
        [breadcrumbs]="[
          { label: 'Accounts & Cash', url: '/accounting/transaction' },
          { label: 'Reports', url: '/dashboard/cashbook' },
          { label: 'Sales Performance' }
        ]"
      >
        <!-- Filter Toolbar -->
        <div filters class="flex items-end gap-2 shrink-0 flex-nowrap py-1">
          <!-- Quick Filter Presets -->
          <div class="flex flex-col">
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Filter Preset</label>
            <div class="inline-flex rounded-md shadow-xs bg-slate-100 p-0.5" role="group">
              <button
                type="button"
                (click)="applyPreset('today')"
                class="px-2.5 py-1 text-xs font-semibold rounded transition-colors"
                [ngClass]="activePreset === 'today' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'"
              >
                Today's Sale
              </button>
              <button
                type="button"
                (click)="applyPreset('week')"
                class="px-2.5 py-1 text-xs font-semibold rounded transition-colors"
                [ngClass]="activePreset === 'week' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'"
              >
                This Week
              </button>
              <button
                type="button"
                (click)="applyPreset('month')"
                class="px-2.5 py-1 text-xs font-semibold rounded transition-colors"
                [ngClass]="activePreset === 'month' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'"
              >
                This Month
              </button>
            </div>
          </div>

          <!-- Date Range Pickers -->
          <div class="flex flex-col">
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">From Date</label>
            <nz-date-picker
              [(ngModel)]="fromDate"
              (ngModelChange)="onDateChange()"
              nzFormat="dd-MM-yyyy"
              nzPlaceHolder="From Date"
              class="w-32 shrink-0 rounded-md text-xs"
            ></nz-date-picker>
          </div>

          <div class="flex flex-col">
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">To Date</label>
            <nz-date-picker
              [(ngModel)]="toDate"
              (ngModelChange)="onDateChange()"
              nzFormat="dd-MM-yyyy"
              nzPlaceHolder="To Date"
              class="w-32 shrink-0 rounded-md text-xs"
            ></nz-date-picker>
          </div>

          <!-- Sort Selector -->
          <div class="flex flex-col">
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Rank By</label>
            <nz-select class="w-36 text-xs" [(ngModel)]="sortBy" (ngModelChange)="loadAnalytics()">
              <nz-option nzValue="qty" nzLabel="Units Sold"></nz-option>
              <nz-option nzValue="revenue" nzLabel="Sales Revenue"></nz-option>
              <nz-option nzValue="profit" nzLabel="Gross Profit"></nz-option>
              <nz-option nzValue="margin" nzLabel="Margin %"></nz-option>
            </nz-select>
          </div>

          <!-- Items Limit -->
          <div class="flex flex-col">
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Show Top</label>
            <nz-select class="w-24 text-xs" [(ngModel)]="limit" (ngModelChange)="loadAnalytics()">
              <nz-option [nzValue]="10" nzLabel="Top 10"></nz-option>
              <nz-option [nzValue]="25" nzLabel="Top 25"></nz-option>
              <nz-option [nzValue]="50" nzLabel="Top 50"></nz-option>
              <nz-option [nzValue]="100" nzLabel="Top 100"></nz-option>
            </nz-select>
          </div>

          <!-- Search Filter -->
          <div class="flex flex-col">
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Search Item</label>
            <nz-input-group [nzPrefix]="searchIcon" class="w-48 rounded-md">
              <input
                type="text"
                nz-input
                placeholder="Product or generic..."
                [(ngModel)]="searchQuery"
                class="text-xs"
              />
            </nz-input-group>
            <ng-template #searchIcon>
              <span nz-icon nzType="search" class="text-slate-400"></span>
            </ng-template>
          </div>

          <!-- Reset Button -->
          <button
            nz-button
            class="rounded-md h-8 px-2.5 text-xs shrink-0 inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            (click)="resetFilters()"
          >
            <span nz-icon nzType="clear"></span> Reset
          </button>
        </div>

        <!-- Header Actions -->
        <div actions class="flex items-center gap-2 shrink-0 flex-nowrap">
          <a
            nz-button
            routerLink="/dashboard/cashbook"
            class="rounded-md text-xs inline-flex items-center gap-1 text-slate-700"
          >
            <span nz-icon nzType="wallet"></span> Cashbook Register
          </a>
          <button
            nz-button
            nzType="default"
            class="rounded-md text-xs inline-flex items-center gap-1"
            (click)="exportCsv()"
          >
            <span nz-icon nzType="download"></span> Export CSV
          </button>
          <button
            nz-button
            nzType="primary"
            class="rounded-md text-xs inline-flex items-center gap-1"
            (click)="printReport()"
          >
            <span nz-icon nzType="printer"></span> Print Report
          </button>
        </div>
      </app-page-header>

      <!-- KPI Summary Cards Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        <!-- 1. Total Units Sold -->
        <div class="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Units Sold</span>
          <div class="mt-2 flex items-baseline justify-between">
            <span class="font-mono text-xl font-bold text-slate-900">{{ totalSoldQty | number }} pcs</span>
            <span class="text-xs text-slate-400">{{ filteredProducts().length }} items ranked</span>
          </div>
        </div>

        <!-- 2. Total Sales Revenue -->
        <div class="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sales Revenue</span>
          <div class="mt-2 flex items-baseline justify-between">
            <span class="font-mono text-xl font-bold text-sky-700">৳ {{ totalRevenue | number: '1.2-2' }}</span>
            <span class="text-xs text-sky-600 font-medium">Ranked share</span>
          </div>
        </div>

        <!-- 3. Total Gross Profit -->
        <div class="bg-white rounded-xl border border-emerald-200 bg-emerald-50/20 p-3.5 shadow-xs flex flex-col justify-between">
          <span class="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Total Gross Profit</span>
          <div class="mt-2 flex items-baseline justify-between">
            <span class="font-mono text-xl font-bold text-emerald-700">৳ {{ totalProfit | number: '1.2-2' }}</span>
            <span class="text-xs text-emerald-600 font-semibold">{{ avgMarginPct }}% margin</span>
          </div>
        </div>

        <!-- 4. Top Performer Product -->
        <div class="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">#1 Fast Mover</span>
          <div class="mt-2 truncate">
            <span class="font-bold text-slate-900 text-sm truncate block" [title]="topProduct()?.product_name || 'N/A'">
              {{ topProduct()?.product_name || 'No data recorded' }}
            </span>
            <p class="text-xs text-slate-500 m-0 mt-0.5 truncate font-mono">
              {{ topProduct()?.total_sold_pcs || 0 }} pcs sold | ৳ {{ (topProduct()?.total_revenue || 0) | number: '1.2-2' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Main Content Data Table -->
      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <nz-spin [nzSpinning]="isLoading()" class="flex-1 min-h-0 flex flex-col">
          @if (filteredProducts().length > 0) {
            <div class="flex-1 min-h-0 overflow-auto">
              <table class="w-full text-left border-collapse text-xs print-table">
                <thead class="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th class="p-2.5 w-14 text-center">Rank</th>
                    <th class="p-2.5">Product Name</th>
                    <th class="p-2.5 w-48">Generic Formula</th>
                    <th class="p-2.5 text-right w-32 text-slate-800">Units Sold (pcs)</th>
                    <th class="p-2.5 text-right w-36 text-sky-800">Sales Revenue (৳)</th>
                    <th class="p-2.5 text-right w-36 text-emerald-800">Gross Profit (৳)</th>
                    <th class="p-2.5 text-right w-28">Margin %</th>
                    <th class="p-2.5 text-right w-28">Revenue Share</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (p of filteredProducts(); track p.product_no; let idx = $index) {
                    <tr class="hover:bg-slate-50/75 transition-colors">
                      <!-- Rank Medal / Number -->
                      <td class="p-2.5 text-center font-mono">
                        @if (idx === 0) {
                          <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-xs border border-amber-300">
                            1
                          </span>
                        } @else if (idx === 1) {
                          <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300">
                            2
                          </span>
                        } @else if (idx === 2) {
                          <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-900 font-bold text-xs border border-amber-200">
                            3
                          </span>
                        } @else {
                          <span class="text-slate-500 font-medium">#{{ idx + 1 }}</span>
                        }
                      </td>

                      <!-- Product Name -->
                      <td class="p-2.5">
                        <span class="font-semibold text-slate-900 block truncate" [title]="p.product_name">
                          {{ p.product_name }}
                        </span>
                      </td>

                      <!-- Generic Name -->
                      <td class="p-2.5 text-slate-500 truncate" [title]="p.generic_name || 'N/A'">
                        {{ p.generic_name || '—' }}
                      </td>

                      <!-- Units Sold -->
                      <td class="p-2.5 text-right font-mono font-bold text-slate-800">
                        {{ p.total_sold_pcs | number }} pcs
                      </td>

                      <!-- Sales Revenue -->
                      <td class="p-2.5 text-right font-mono font-bold text-sky-800">
                        ৳ {{ p.total_revenue | number: '1.2-2' }}
                      </td>

                      <!-- Gross Profit -->
                      <td class="p-2.5 text-right font-mono font-semibold text-emerald-700">
                        ৳ {{ (p.total_profit || 0) | number: '1.2-2' }}
                      </td>

                      <!-- Margin % -->
                      <td class="p-2.5 text-right font-mono">
                        <span
                          class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          [ngClass]="(p.profit_margin_pct || 0) >= 15 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'"
                        >
                          {{ (p.profit_margin_pct || 0) | number: '1.1-1' }}%
                        </span>
                      </td>

                      <!-- Revenue Share % -->
                      <td class="p-2.5 text-right font-mono text-slate-500">
                        {{ totalRevenue > 0 ? ((p.total_revenue / totalRevenue) * 100 | number: '1.1-1') : '0.0' }}%
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Sticky Table Footer -->
            <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-600 font-medium">
              <div class="flex items-center gap-3">
                <span>Ranked Items: <strong class="text-slate-900 font-mono">{{ filteredProducts().length }}</strong></span>
                <span class="text-slate-300">|</span>
                <span>Date Range: <strong class="text-slate-900 font-mono">{{ fromDateFormatted }} to {{ toDateFormatted }}</strong></span>
              </div>
              <div class="flex items-center gap-4 font-mono">
                <span>Total Sold: <strong class="text-slate-900 font-bold">{{ totalSoldQty | number }} pcs</strong></span>
                <span class="text-slate-300">|</span>
                <span>Revenue: <strong class="text-sky-800 font-bold">৳ {{ totalRevenue | number: '1.2-2' }}</strong></span>
                <span class="text-slate-300">|</span>
                <span>Profit: <strong class="text-emerald-700 font-bold">৳ {{ totalProfit | number: '1.2-2' }}</strong></span>
              </div>
            </div>
          } @else {
            <div class="flex-1 min-h-0 flex items-center justify-center p-8">
              <app-empty-state
                title="No sales performance data found"
                description="No products were sold in the selected date range. Try switching presets or expanding the date filter."
              >
              </app-empty-state>
            </div>
          }
        </nz-spin>
      </div>
    </div>
  `,
  styles: [
    `
      @media print {
        :host {
          display: block;
          background: white !important;
        }
        .table-sticky-footer, app-page-header, .btn-tbl-action {
          display: none !important;
        }
        .print-table {
          width: 100% !important;
          border-collapse: collapse !important;
        }
        .print-table th, .print-table td {
          border: 1px solid #cbd5e1 !important;
          padding: 6px !important;
        }
      }
    `,
  ],
})
export class AnalyticsReportComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly msg = inject(NzMessageService);

  // Filter state
  activePreset: DatePreset = 'today';
  fromDate: Date | null = new Date();
  toDate: Date | null = new Date();

  get fromDateFormatted(): string {
    return formatDateToDdMmYyyy(this.fromDate);
  }

  get toDateFormatted(): string {
    return formatDateToDdMmYyyy(this.toDate);
  }
  sortBy: 'qty' | 'revenue' | 'profit' | 'margin' = 'qty';
  limit = 25;
  searchQuery = '';

  // Data signals
  products = signal<FastMovingProduct[]>([]);
  isLoading = signal(false);

  // Filtered products signal
  filteredProducts = computed(() => {
    let list = this.products();
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        p =>
          p.product_name.toLowerCase().includes(q) ||
          (p.generic_name && p.generic_name.toLowerCase().includes(q))
      );
    }
    return list;
  });

  // KPI computations
  get totalSoldQty(): number {
    return this.filteredProducts().reduce((sum, p) => sum + (p.total_sold_pcs || 0), 0);
  }

  get totalRevenue(): number {
    return this.filteredProducts().reduce((sum, p) => sum + (p.total_revenue || 0), 0);
  }

  get totalProfit(): number {
    return this.filteredProducts().reduce((sum, p) => sum + (p.total_profit || 0), 0);
  }

  get avgMarginPct(): string {
    if (this.totalRevenue <= 0) return '0.0';
    return ((this.totalProfit / this.totalRevenue) * 100).toFixed(1);
  }

  topProduct = computed(() => {
    const list = this.filteredProducts();
    return list.length ? list[0] : null;
  });

  ngOnInit(): void {
    this.applyPreset('today');
  }

  applyPreset(preset: DatePreset): void {
    this.activePreset = preset;
    const now = new Date();



    if (preset === 'today') {
      this.fromDate = now;
      this.toDate = now;
    } else if (preset === 'week') {
      const past7 = new Date(now);
      past7.setDate(past7.getDate() - 6);
      this.fromDate = past7;
      this.toDate = now;
    } else if (preset === 'month') {
      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      this.fromDate = startMonth;
      this.toDate = now;
    }

    this.loadAnalytics();
  }

  onDateChange(): void {
    this.activePreset = 'custom';
    this.loadAnalytics();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.sortBy = 'qty';
    this.limit = 25;
    this.applyPreset('today');
  }

  loadAnalytics(): void {
    this.isLoading.set(true);
    this.dashboardService
      .getAnalytics({
        fromDate: this.fromDateFormatted,
        toDate: this.toDateFormatted,
        limit: this.limit,
        sort: 'desc',
        sortBy: this.sortBy,
      })
      .subscribe({
        next: res => {
          this.isLoading.set(false);
          this.products.set(res.data || []);
        },
        error: () => this.isLoading.set(false),
      });
  }

  exportCsv(): void {
    const list = this.filteredProducts();
    if (!list.length) {
      this.msg.warning('No products to export.');
      return;
    }
    const headers = ['# Rank', 'Product Name', 'Generic Name', 'Units Sold (pcs)', 'Sales Revenue (BDT)', 'Gross Profit (BDT)', 'Margin %'];
    const rows = list.map((p, i) => [
      i + 1,
      `"${p.product_name}"`,
      `"${p.generic_name || ''}"`,
      p.total_sold_pcs,
      p.total_revenue.toFixed(2),
      (p.total_profit || 0).toFixed(2),
      (p.profit_margin_pct || 0).toFixed(1),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_performance_${this.fromDateFormatted}_to_${this.toDateFormatted}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.msg.success(`Exported sales performance report`);
  }

  printReport(): void {
    window.print();
  }
}

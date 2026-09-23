import { Component, inject, ChangeDetectionStrategy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend } from 'chart.js';
import {
  BUSINESS_MODE_OPTIONS,
  BusinessMode,
} from '../../shared/constants/label-values.constant';
import { AuthService } from '../../core/auth/auth.service';
import { DashboardService, DashboardSummary, FastMovingProduct } from '../../core/services/dashboard.service';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend);

interface KpiStat {
  title: string;
  value: string;
  subtext?: string;
  icon: string;
  colorClass: string;
  change?: string;
  isPositive?: boolean;
}

interface TopProduct {
  name: string;
  generic: string;
  qty: number;
  total: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzSelectModule,
    NzTableModule,
    NzTagModule,
    NzIconModule,
    BaseChartDirective
  ],
  template: `
    <div class="space-y-5 pb-8">
      <!-- Header Bar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pms-card p-4">
        <div>
          <h1 class="text-xl font-bold text-slate-900 m-0 font-display">{{ todayLabel() }}</h1>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Business Mode Selector -->
          <div class="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
            @for (mode of businessModes; track mode.value) {
              <button
                type="button"
                (click)="selectedMode = mode.value"
                class="px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer border-0"
                [ngClass]="
                  selectedMode === mode.value
                    ? 'theme-pill-active font-semibold'
                    : 'bg-transparent text-slate-600 hover:text-slate-900'
                "
              >
                {{ mode.label }}
              </button>
            }
          </div>

          <!-- Branch Selector -->
          <nz-select [(ngModel)]="selectedBranch" class="w-40">
            <nz-option nzValue="all" nzLabel="All Branches"></nz-option>
            @for (br of branchOptions(); track br.value) {
              <nz-option [nzValue]="br.value" [nzLabel]="br.label"></nz-option>
            }
          </nz-select>
          
          <!-- Date Range -->
          <div class="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 flex items-center gap-2">
            <span>📅</span>
            <span>{{ dateRangeLabel() }}</span>
          </div>

          <!-- Quick Actions Button -->
          <a
            routerLink="/customer/sale"
            nz-button
            nzType="primary"
            class="rounded-lg font-medium flex items-center gap-1.5"
          >
            <span nz-icon nzType="shopping-cart"></span>
            Open Retail POS
          </a>
        </div>
      </div>

      <!-- 8 Key KPI Metric Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        @for (stat of kpiStats; track stat.title) {
          <div class="pms-card p-4 flex flex-col justify-between">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-xs font-medium text-slate-500 uppercase tracking-wider m-0">{{ stat.title }}</p>
                <h3 class="text-2xl font-bold text-slate-900 mt-1.5 mb-0 font-display tracking-tight">{{ stat.value }}</h3>
              </div>
              <div class="w-10 h-10 rounded-lg flex items-center justify-center text-lg" [ngClass]="stat.colorClass">
                <span nz-icon [nzType]="stat.icon"></span>
              </div>
            </div>
            <div class="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs">
              <span class="text-slate-500">{{ stat.subtext || '&nbsp;' }}</span>
              @if (stat.change) {
                <span
                  class="font-semibold"
                  [ngClass]="stat.isPositive ? 'text-emerald-600' : 'text-rose-600'"
                >
                  {{ stat.change }}
                </span>
              }
            </div>
          </div>
        }
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div class="pms-card p-4">
          <h2 class="text-sm font-bold text-slate-900 mb-4 m-0">Buy Price vs Gross Profit</h2>
          <canvas baseChart [type]="'line'" [data]="areaChartData" [options]="areaChartOptions" class="w-full" style="height: 250px"></canvas>
        </div>
        <div class="pms-card p-4">
          <h2 class="text-sm font-bold text-slate-900 mb-4 m-0">Gross Profit Breakdown</h2>
          <canvas baseChart [type]="'bar'" [data]="barChartData" [options]="barChartOptions" class="w-full" style="height: 250px"></canvas>
        </div>
      </div>

      <!-- Product Tables Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <!-- Top Selling Products -->
        <div class="pms-card">
          <div class="pms-card-header">
            <h2 class="pms-card-title">Top Selling Products</h2>
          </div>
          <div class="p-0 overflow-auto">
            <nz-table
              #topTable
              [nzData]="topSelling"
              [nzFrontPagination]="false"
              [nzShowPagination]="false"
            >
              <thead>
                <tr>
                  <th class="w-12 text-center">#</th>
                  <th>Product</th>
                  <th>Generic</th>
                  <th nzAlign="right">Qty</th>
                  <th nzAlign="right">Total Sales</th>
                </tr>
              </thead>
              <tbody>
                @for (item of topTable.data; track item.name; let i = $index) {
                  <tr
                    class="transition-colors"
                    [class.row-odd]="i % 2 === 0"
                    [class.row-even]="i % 2 === 1"
                  >
                    <td class="text-center">
                      <span class="pms-badge-rank">
                        {{ i + 1 }}
                      </span>
                    </td>
                    <td>
                      <div class="flex flex-col">
                        <span class="font-semibold text-slate-900 leading-tight">{{ item.name }}</span>
                        <span class="text-[11px] text-slate-400 leading-tight mt-0.5">{{ item.generic }}</span>
                      </div>
                    </td>
                    <td class="text-slate-500">{{ item.generic }}</td>
                    <td nzAlign="right">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 font-mono text-xs font-semibold text-slate-700">
                        {{ item.qty }}
                      </span>
                    </td>
                    <td nzAlign="right" class="font-mono font-bold theme-total-text">{{ item.total }}</td>
                  </tr>
                }
              </tbody>
            </nz-table>
          </div>
        </div>

        <!-- Lowest Selling Products -->
        <div class="pms-card">
          <div class="pms-card-header">
            <h2 class="pms-card-title">Lowest Selling Products</h2>
          </div>
          <div class="p-0 overflow-auto">
            <nz-table
              #lowestTable
              [nzData]="lowestSelling"
              [nzFrontPagination]="false"
              [nzShowPagination]="false"
            >
              <thead>
                <tr>
                  <th class="w-12 text-center">#</th>
                  <th>Product</th>
                  <th>Generic</th>
                  <th nzAlign="right">Qty</th>
                  <th nzAlign="right">Total Sales</th>
                </tr>
              </thead>
              <tbody>
                @for (item of lowestTable.data; track item.name; let i = $index) {
                  <tr
                    class="transition-colors"
                    [class.row-odd]="i % 2 === 0"
                    [class.row-even]="i % 2 === 1"
                  >
                    <td class="text-center">
                      <span class="pms-badge-rank">
                        {{ i + 1 }}
                      </span>
                    </td>
                    <td>
                      <div class="flex flex-col">
                        <span class="font-semibold text-slate-900 leading-tight">{{ item.name }}</span>
                        <span class="text-[11px] text-slate-400 leading-tight mt-0.5">{{ item.generic }}</span>
                      </div>
                    </td>
                    <td class="text-slate-500">{{ item.generic }}</td>
                    <td nzAlign="right">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 font-mono text-xs font-semibold text-slate-700">
                        {{ item.qty }}
                      </span>
                    </td>
                    <td nzAlign="right" class="font-mono font-bold theme-total-text">{{ item.total }}</td>
                  </tr>
                }
              </tbody>
            </nz-table>
          </div>
        </div>
      </div>

      <!-- Financial Summary Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <!-- Cashbook Summary Card -->
        <div class="pms-card p-4 flex flex-col">
          <h2 class="text-sm font-bold text-slate-900 mb-4 m-0">Cashbook Summary</h2>
          <div class="space-y-2 text-sm flex-1">
            <div class="flex justify-between items-center"><span class="text-slate-600">Gross Profit</span><span class="font-mono font-medium theme-total-text">৳ {{ formatBd(summary()?.today_profit || 0) }}</span></div>
            <div class="flex justify-between items-center"><span class="text-slate-600">+ Income</span><span class="font-mono font-medium theme-total-text">৳ {{ formatBd(summary()?.today_cash_collected || 0) }}</span></div>
            <div class="flex justify-between items-center"><span class="text-slate-600">− Operational Cost</span><span class="font-mono font-medium text-rose-600">৳ {{ formatBd(summary()?.today_expenses || 0) }}</span></div>
            <div class="flex justify-between items-center"><span class="text-slate-600">− Demurrage</span><span class="font-mono font-medium text-rose-600">৳ 0</span></div>
          </div>
          <div class="mt-4 theme-highlight-card font-bold p-3 rounded-lg flex justify-between items-center text-base">
            <span class="theme-highlight-title">Net Profit</span><span class="theme-highlight-value">৳ {{ formatBd((summary()?.today_profit || 0) - (summary()?.today_expenses || 0)) }}</span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-sm border-t border-slate-100 pt-4">
            <div>
              <p class="text-slate-500 text-xs mb-1 m-0">Cash Balance</p>
              <p class="font-mono font-semibold text-slate-800 m-0">৳ {{ formatBd(summary()?.today_cash_collected || 0) }}</p>
            </div>
            <div>
              <p class="text-slate-500 text-xs mb-1 m-0">Bank Balance</p>
              <p class="font-mono font-semibold text-slate-800 m-0">৳ 0</p>
            </div>
            <div>
              <p class="text-slate-500 text-xs mb-1 m-0">MFS Balance</p>
              <p class="font-mono font-semibold text-slate-800 m-0">৳ 0</p>
            </div>
            <div>
              <p class="text-slate-500 text-xs mb-1 m-0">Closing Balance</p>
              <p class="font-mono font-semibold theme-total-text m-0">৳ {{ formatBd(summary()?.today_cash_collected || 0) }}</p>
            </div>
          </div>
        </div>

        <!-- Buy & Sale Summary Card -->
        <div class="pms-card p-4">
          <h2 class="text-sm font-bold text-slate-900 mb-4 m-0">Buy & Sale Summary</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div class="flex justify-between items-center border-b border-slate-100 pb-2"><span class="text-slate-600">Total Sale</span><span class="font-mono font-medium text-slate-800">৳ {{ formatBd(summary()?.today_sales || 0) }}</span></div>
            <div class="flex justify-between items-center border-b border-slate-100 pb-2"><span class="text-slate-600">Inventory Purchase</span><span class="font-mono font-medium text-slate-800">৳ {{ formatBd(summary()?.today_purchases || 0) }}</span></div>
            <div class="flex justify-between items-center border-b border-slate-100 pb-2"><span class="text-slate-600">Due Sales</span><span class="font-mono font-medium text-amber-600">৳ {{ formatBd(summary()?.total_customer_due || 0) }}</span></div>
            <div class="flex justify-between items-center border-b border-slate-100 pb-2"><span class="text-slate-600">Due Purchase</span><span class="font-mono font-medium text-amber-600">৳ {{ formatBd(summary()?.total_supplier_payable || 0) }}</span></div>
            <div class="flex justify-between items-center border-b border-slate-100 pb-2"><span class="text-slate-600">Sale Return</span><span class="font-mono font-medium text-rose-600">৳ 0</span></div>
            <div class="flex justify-between items-center border-b border-slate-100 pb-2"><span class="text-slate-600">Purchase Return</span><span class="font-mono font-medium text-rose-600">৳ 0</span></div>
            <div class="flex justify-between items-center border-b border-slate-100 pb-2"><span class="text-slate-600">Due Payment Received</span><span class="font-mono font-medium theme-total-text">৳ 0</span></div>
            <div class="flex justify-between items-center border-b border-slate-100 pb-2"><span class="text-slate-600">Due Purchase Paid</span><span class="font-mono font-medium theme-total-text">৳ 0</span></div>
          </div>
        </div>
      </div>

      <!-- Near-Expiry & Reorder Alert Warnings -->
      <div class="pms-card overflow-hidden flex flex-col">
        <div class="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 class="text-sm font-bold text-slate-900 m-0">Inventory Priority Alerts</h2>
            <p class="text-xs text-slate-400 m-0">Batches requiring manager attention</p>
          </div>
          <a routerLink="/products/expired" class="text-xs text-rose-600 hover:text-rose-700 font-medium">
            Check Expiries →
          </a>
        </div>
        <div class="p-4 space-y-3 flex-1">
          <div class="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-3">
            <span nz-icon nzType="warning" class="text-amber-500 text-lg mt-0.5"></span>
            <div class="flex-1 text-xs">
              <p class="font-semibold text-amber-900 m-0">Near-Expiry Warning ({{ summary()?.near_expiry_items_count || 0 }} Batches)</p>
              <p class="text-amber-700 mt-0.5 m-0">
                Batches reaching shelf expiry within 90 days. Review and take action.
              </p>
            </div>
            <a routerLink="/products/expired" nz-button nzSize="small" nzType="default" class="text-xs font-medium border-amber-300 text-amber-800">
              Review
            </a>
          </div>

          <div class="p-3 bg-rose-50 rounded-lg border border-rose-200 flex items-start gap-3">
            <span nz-icon nzType="close-circle" class="text-rose-500 text-lg mt-0.5"></span>
            <div class="flex-1 text-xs">
              <p class="font-semibold text-rose-900 m-0">Out of Stock & Shortages ({{ summary()?.low_stock_items_count || 0 }} Items)</p>
              <p class="text-rose-700 mt-0.5 m-0">
                {{ summary()?.low_stock_items_count || 0 }} high-demand items are currently below minimum reorder threshold.
              </p>
            </div>
            <a routerLink="/products/requisition" nz-button nzSize="small" nzType="primary" nzDanger class="text-xs font-medium">
              Requisition
            </a>
          </div>

          <div class="p-3 theme-highlight-card rounded-lg flex items-start gap-3">
            <span nz-icon nzType="info-circle" class="theme-highlight-subtitle text-lg mt-0.5"></span>
            <div class="flex-1 text-xs">
              <p class="font-semibold theme-highlight-title m-0">Cash Handover Ready</p>
              <p class="theme-highlight-subtitle mt-0.5 m-0">
                Counter 1 has closed register. Ready for manager handover confirmation.
              </p>
            </div>
            <a routerLink="/cash/receive" nz-button nzSize="small" class="theme-btn-soft text-xs font-medium">
              Confirm
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  readonly businessModes = BUSINESS_MODE_OPTIONS;
  selectedMode: number = BusinessMode.Retail;
  selectedBranch = 'all';

  summary = signal<DashboardSummary | null>(null);
  branchOptions = signal<{ value: string; label: string }[]>([]);

  todayLabel = signal<string>(
    new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  );

  dateRangeLabel = signal<string>((() => {
    const now = new Date();
    const week = new Date(now.getTime() - 6 * 86400000);
    const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    return `${fmt(week)} ~ ${fmt(now)}`;
  })());

  kpiStats: KpiStat[] = [];
  topSelling: TopProduct[] = [];
  lowestSelling: TopProduct[] = [];

  areaChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  barChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };

  readonly areaChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true } }
  };

  readonly barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true, stacked: true }, x: { stacked: true } }
  };

  ngOnInit(): void {
    this.loadSummary();
    this.loadAnalytics();
  }

  private loadSummary(): void {
    this.dashboardService.getSummary().subscribe({
      next: res => {
        if (res.data) {
          this.summary.set(res.data);
          this.buildKpiStats(res.data);
        }
      }
    });
  }

  private loadAnalytics(): void {
    this.dashboardService.getAnalytics(5).subscribe({
      next: res => {
        if (res.data) {
          this.topSelling = res.data.map(p => ({
            name: p.product_name,
            generic: '',
            qty: p.total_sold_pcs,
            total: `৳ ${this.formatBd(p.total_revenue)}`
          }));
        }
      }
    });

    // Lowest selling — get bottom 5
    this.dashboardService.getAnalytics(100).subscribe({
      next: res => {
        if (res.data && res.data.length > 0) {
          const bottom = res.data.slice(-4);
          this.lowestSelling = bottom.map(p => ({
            name: p.product_name,
            generic: '',
            qty: p.total_sold_pcs,
            total: `৳ ${this.formatBd(p.total_revenue)}`
          }));
        }
      }
    });
  }

  private buildKpiStats(s: DashboardSummary): void {
    this.kpiStats = [
      { title: 'Current Cash Balance', value: `৳ ${this.formatBd(s.today_cash_collected)}`, icon: 'dollar', colorClass: 'theme-avatar' },
      { title: 'Bank Balance', value: '৳ 0', icon: 'bank', colorClass: 'bg-blue-50 text-blue-600' },
      { title: 'MFS Balance', value: '৳ 0', icon: 'swap', colorClass: 'bg-purple-50 text-purple-600' },
      { title: "Today's Sale", value: `৳ ${this.formatBd(s.today_sales)}`, icon: 'fund', colorClass: 'bg-emerald-50 text-emerald-600', subtext: `${s.today_sales_count} invoices` },
      { title: "Today's Purchase", value: `৳ ${this.formatBd(s.today_purchases)}`, icon: 'shopping-cart', colorClass: 'bg-amber-50 text-amber-600' },
      { title: 'Full Inventory Cost', value: `৳ ${this.formatBd(s.total_inventory_valuation)}`, icon: 'shop', colorClass: 'theme-avatar' },
      { title: 'Total Items (SKU)', value: s.total_products_count.toLocaleString('en-IN'), subtext: 'Distinct products', icon: 'medicine-box', colorClass: 'bg-pink-50 text-pink-600' },
      { title: 'Expired Batches', value: s.expired_items_count.toLocaleString('en-IN'), subtext: 'Need attention', icon: 'barcode', colorClass: 'theme-avatar' },
    ];
  }

  formatBd(val: number): string {
    return val.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
}

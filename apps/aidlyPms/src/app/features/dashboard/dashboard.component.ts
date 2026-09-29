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
import { ChartConfiguration, Chart, registerables } from 'chart.js';
import {
  BUSINESS_MODE_OPTIONS,
  BusinessMode,
} from '../../shared/constants/label-values.constant';
import { AuthService } from '../../core/auth/auth.service';
import { DashboardService, DashboardSummary, FastMovingProduct } from '../../core/services/dashboard.service';

Chart.register(...registerables);

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
                (click)="onModeChange(mode.value)"
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
          <nz-select [(ngModel)]="selectedBranch" (ngModelChange)="onBranchChange($event)" class="w-40">
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
        <div class="pms-card p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-bold text-slate-900 m-0">Buy Price vs Gross Profit</h2>
            <span class="text-[11px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded">Last 7 days</span>
          </div>
          <div class="relative w-full h-[250px] min-h-[250px] max-h-[250px] overflow-hidden">
            <canvas baseChart [type]="'line'" [data]="areaChartData" [options]="areaChartOptions"></canvas>
          </div>
        </div>
        <div class="pms-card p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-bold text-slate-900 m-0">Gross Profit Breakdown</h2>
            <span class="text-[11px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded">Last 7 days</span>
          </div>
          <div class="relative w-full h-[250px] min-h-[250px] max-h-[250px] overflow-hidden">
            <canvas baseChart [type]="'bar'" [data]="barChartData" [options]="barChartOptions"></canvas>
          </div>
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
            <div class="flex justify-between items-center"><span class="text-slate-600">+ Income</span><span class="font-mono font-medium theme-total-text">৳ {{ formatBd(summary()?.today_incomes || 0) }}</span></div>
            <div class="flex justify-between items-center"><span class="text-slate-600">− Operational Cost</span><span class="font-mono font-medium text-rose-600">৳ {{ formatBd(summary()?.today_expenses || 0) }}</span></div>
            <div class="flex justify-between items-center"><span class="text-slate-600">− Demurrage</span><span class="font-mono font-medium text-rose-600">৳ {{ formatBd(summary()?.today_demurrage || 0) }}</span></div>
          </div>
          <div class="mt-4 theme-highlight-card font-bold p-3 rounded-lg flex justify-between items-center text-base">
            <span class="theme-highlight-title">Net Profit</span><span class="theme-highlight-value">৳ {{ formatBd((summary()?.today_profit || 0) + (summary()?.today_incomes || 0) - (summary()?.today_expenses || 0) - (summary()?.today_demurrage || 0)) }}</span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-sm border-t border-slate-100 pt-4">
            <div>
              <p class="text-slate-500 text-xs mb-1 m-0">Cash Balance</p>
              <p class="font-mono font-semibold text-slate-800 m-0">৳ {{ formatBd(summary()?.total_cash_balance || 0) }}</p>
            </div>
            <div>
              <p class="text-slate-500 text-xs mb-1 m-0">Bank Balance</p>
              <p class="font-mono font-semibold text-slate-800 m-0">৳ {{ formatBd(summary()?.total_bank_balance || 0) }}</p>
            </div>
            <div>
              <p class="text-slate-500 text-xs mb-1 m-0">MFS Balance</p>
              <p class="font-mono font-semibold text-slate-800 m-0">৳ {{ formatBd(summary()?.total_mfs_balance || 0) }}</p>
            </div>
            <div>
              <p class="text-slate-500 text-xs mb-1 m-0">Closing Balance</p>
              <p class="font-mono font-semibold theme-total-text m-0">৳ {{ formatBd((summary()?.total_cash_balance || 0) + (summary()?.total_bank_balance || 0) + (summary()?.total_mfs_balance || 0)) }}</p>
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
            <div class="flex justify-between items-center border-b border-slate-100 pb-2"><span class="text-slate-600">Sale Return</span><span class="font-mono font-medium text-rose-600">৳ {{ formatBd(summary()?.today_sale_returns || 0) }}</span></div>
            <div class="flex justify-between items-center border-b border-slate-100 pb-2"><span class="text-slate-600">Purchase Return</span><span class="font-mono font-medium text-rose-600">৳ {{ formatBd(summary()?.today_purchase_returns || 0) }}</span></div>
            <div class="flex justify-between items-center border-b border-slate-100 pb-2"><span class="text-slate-600">Due Payment Received</span><span class="font-mono font-medium theme-total-text">৳ {{ formatBd(summary()?.today_due_collected || 0) }}</span></div>
            <div class="flex justify-between items-center border-b border-slate-100 pb-2"><span class="text-slate-600">Due Purchase Paid</span><span class="font-mono font-medium theme-total-text">৳ {{ formatBd(summary()?.today_supplier_paid || 0) }}</span></div>
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
              <p class="font-semibold theme-highlight-title m-0">Cash Handover Pending ({{ summary()?.pending_handover_count || 0 }} Transactions)</p>
              <p class="theme-highlight-subtitle mt-0.5 m-0">
                ৳ {{ formatBd(summary()?.pending_handover_amount || 0) }} awaiting manager handover confirmation.
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

  areaChartData: ChartConfiguration['data'] = {
    labels: ['Sep 19', 'Sep 20', 'Sep 21', 'Sep 22', 'Sep 23', 'Sep 24', 'Sep 25'],
    datasets: [
      {
        data: [18200, 21500, 16800, 24300, 19700, 22100, 17900],
        label: 'Buy Price',
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5
      },
      {
        data: [6400, 7100, 5900, 8200, 7600, 8800, 6700],
        label: 'Gross Profit',
        borderColor: '#0d9488',
        backgroundColor: 'rgba(13, 148, 136, 0.15)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5
      }
    ]
  };

  barChartData: ChartConfiguration['data'] = {
    labels: ['Sep 19', 'Sep 20', 'Sep 21', 'Sep 22', 'Sep 23', 'Sep 24', 'Sep 25'],
    datasets: [
      {
        data: [4200, 5100, 3900, 6200, 5600, 6800, 4700],
        label: 'Net Profit',
        backgroundColor: '#0d9488',
        borderRadius: 4
      },
      {
        data: [2200, 2000, 2000, 2000, 2000, 2000, 2000],
        label: 'Op Cost',
        backgroundColor: '#f59e0b',
        borderRadius: 4
      }
    ]
  };

  readonly areaChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ৳ ${Number(context.raw || 0).toLocaleString('en-IN')}`
        }
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (val) => `৳${Number(val) >= 1000 ? (Number(val) / 1000).toFixed(0) + 'k' : val}`
        }
      }
    }
  };

  readonly barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ৳ ${Number(context.raw || 0).toLocaleString('en-IN')}`
        }
      }
    },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: {
        beginAtZero: true,
        stacked: true,
        ticks: {
          callback: (val) => `৳${Number(val) >= 1000 ? (Number(val) / 1000).toFixed(0) + 'k' : val}`
        }
      }
    }
  };

  ngOnInit(): void {
    this.loadBranches();
    this.loadSummary();
    this.loadAnalytics();
    this.loadTrends();
  }

  private loadBranches(): void {
    this.dashboardService.getBranches().subscribe({
      next: res => {
        if (res.data?.length) {
          this.branchOptions.set(res.data.map((b: any) => ({
            value: String(b.branch_no),
            label: b.name
          })));
        }
      }
    });
  }

  private loadTrends(): void {
    this.dashboardService.getTrends().subscribe({
      next: res => {
        if (res.data && res.data.length > 0) {
          const hasData = res.data.some(d => d.total_sale > 0 || d.buy_price > 0 || d.gross_profit > 0);
          if (hasData) {
            const labels = res.data.map(d => d.date_label);
            const buyPrices = res.data.map(d => d.buy_price);
            const grossProfits = res.data.map(d => d.gross_profit);
            const netProfits = res.data.map(d => d.net_profit);
            const opCosts = res.data.map(d => d.op_cost);

            this.areaChartData = {
              labels,
              datasets: [
                {
                  data: buyPrices,
                  label: 'Buy Price',
                  borderColor: '#3b82f6',
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  fill: true,
                  tension: 0.35,
                  pointRadius: 3,
                  pointHoverRadius: 5
                },
                {
                  data: grossProfits,
                  label: 'Gross Profit',
                  borderColor: '#0d9488',
                  backgroundColor: 'rgba(13, 148, 136, 0.2)',
                  fill: true,
                  tension: 0.35,
                  pointRadius: 3,
                  pointHoverRadius: 5
                }
              ]
            };

            this.barChartData = {
              labels,
              datasets: [
                {
                  data: netProfits,
                  label: 'Net Profit',
                  backgroundColor: '#0d9488',
                  borderRadius: 4
                },
                {
                  data: opCosts,
                  label: 'Op Cost',
                  backgroundColor: '#f59e0b',
                  borderRadius: 4
                }
              ]
            };
          }
        }
      }
    });
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
            generic: p.generic_name || 'General',
            qty: p.total_sold_pcs,
            total: `৳ ${this.formatBd(p.total_revenue)}`
          }));
        }
      }
    });

    // Lowest selling — sorted ascending by qty from backend
    this.dashboardService.getAnalytics(5, 'asc').subscribe({
      next: res => {
        if (res.data && res.data.length > 0) {
          this.lowestSelling = res.data.map(p => ({
            name: p.product_name,
            generic: p.generic_name || 'General',
            qty: p.total_sold_pcs,
            total: `৳ ${this.formatBd(p.total_revenue)}`
          }));
        }
      }
    });
  }

  private buildKpiStats(s: DashboardSummary): void {
    this.kpiStats = [
      { title: 'Current Cash Balance', value: `৳ ${this.formatBd(s.total_cash_balance || 0)}`, icon: 'dollar', colorClass: 'theme-avatar' },
      { title: 'Bank Balance', value: `৳ ${this.formatBd(s.total_bank_balance || 0)}`, icon: 'bank', colorClass: 'bg-blue-50 text-blue-600' },
      { title: 'MFS Balance', value: `৳ ${this.formatBd(s.total_mfs_balance || 0)}`, icon: 'swap', colorClass: 'bg-purple-50 text-purple-600' },
      { title: "Today's Sale", value: `৳ ${this.formatBd(s.today_sales)}`, icon: 'fund', colorClass: 'bg-emerald-50 text-emerald-600', subtext: `${s.today_sales_count} invoices` },
      { title: "Today's Purchase", value: `৳ ${this.formatBd(s.today_purchases)}`, icon: 'shopping-cart', colorClass: 'bg-amber-50 text-amber-600' },
      { title: 'Full Inventory Cost', value: `৳ ${this.formatBd(s.total_inventory_valuation)}`, icon: 'shop', colorClass: 'theme-avatar' },
      { title: 'Total Items (SKU)', value: s.total_products_count.toLocaleString('en-IN'), subtext: 'Distinct products', icon: 'medicine-box', colorClass: 'bg-pink-50 text-pink-600' },
      { title: 'Expired Batches', value: s.expired_items_count.toLocaleString('en-IN'), subtext: 'Need attention', icon: 'barcode', colorClass: 'theme-avatar' },
    ];
  }

  onModeChange(mode: number): void {
    this.selectedMode = mode;
    this.reloadAll();
  }

  onBranchChange(_branch: string): void {
    this.reloadAll();
  }

  private reloadAll(): void {
    this.loadSummary();
    this.loadAnalytics();
    this.loadTrends();
  }

  formatBd(val: number): string {
    return val.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
}

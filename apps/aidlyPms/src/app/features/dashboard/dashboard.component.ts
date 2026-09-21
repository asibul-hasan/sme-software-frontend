import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
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
          <h1 class="text-xl font-bold text-slate-900 m-0 font-display">Wednesday, 16 September 2026</h1>
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
            <nz-option nzValue="cumilla" nzLabel="Kazi — Cumilla"></nz-option>
            <nz-option nzValue="dhaka" nzLabel="Dhaka Branch"></nz-option>
          </nz-select>
          
          <!-- Date Range -->
          <div class="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 flex items-center gap-2">
            <span>📅</span>
            <span>10-09-2026 ~ 16-09-2026</span>
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
            <div class="flex justify-between items-center"><span class="text-slate-600">Gross Profit</span><span class="font-mono font-medium theme-total-text">৳ 46,700</span></div>
            <div class="flex justify-between items-center"><span class="text-slate-600">+ Income</span><span class="font-mono font-medium theme-total-text">৳ 3,200</span></div>
            <div class="flex justify-between items-center"><span class="text-slate-600">− Operational Cost</span><span class="font-mono font-medium text-rose-600">৳ 14,000</span></div>
            <div class="flex justify-between items-center"><span class="text-slate-600">− Demurrage</span><span class="font-mono font-medium text-rose-600">৳ 1,500</span></div>
          </div>
          <div class="mt-4 theme-highlight-card font-bold p-3 rounded-lg flex justify-between items-center text-base">
            <span class="theme-highlight-title">Net Profit</span><span class="theme-highlight-value">৳ 34,400</span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-sm border-t border-slate-100 pt-4">
            <div>
              <p class="text-slate-500 text-xs mb-1 m-0">Cash Balance</p>
              <p class="font-mono font-semibold text-slate-800 m-0">৳ 84,250</p>
            </div>
            <div>
              <p class="text-slate-500 text-xs mb-1 m-0">Bank Balance</p>
              <p class="font-mono font-semibold text-slate-800 m-0">৳ 3,42,000</p>
            </div>
            <div>
              <p class="text-slate-500 text-xs mb-1 m-0">MFS Balance</p>
              <p class="font-mono font-semibold text-slate-800 m-0">৳ 18,750</p>
            </div>
            <div>
              <p class="text-slate-500 text-xs mb-1 m-0">Closing Balance</p>
              <p class="font-mono font-semibold theme-total-text m-0">৳ 4,45,000</p>
            </div>
          </div>
        </div>

        <!-- Buy & Sale Summary Card -->
        <div class="pms-card p-4">
          <h2 class="text-sm font-bold text-slate-900 mb-4 m-0">Buy & Sale Summary</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div class="flex justify-between items-center border-b border-slate-100 pb-2"><span class="text-slate-600">Total Sale</span><span class="font-mono font-medium text-slate-800">৳ 1,24,380</span></div>
            <div class="flex justify-between items-center border-b border-slate-100 pb-2"><span class="text-slate-600">Inventory Purchase</span><span class="font-mono font-medium text-slate-800">৳ 82,700</span></div>
            <div class="flex justify-between items-center border-b border-slate-100 pb-2"><span class="text-slate-600">Due Sales</span><span class="font-mono font-medium text-amber-600">৳ 18,200</span></div>
            <div class="flex justify-between items-center border-b border-slate-100 pb-2"><span class="text-slate-600">Due Purchase</span><span class="font-mono font-medium text-amber-600">৳ 14,500</span></div>
            <div class="flex justify-between items-center border-b border-slate-100 pb-2"><span class="text-slate-600">Sale Return</span><span class="font-mono font-medium text-rose-600">৳ 3,400</span></div>
            <div class="flex justify-between items-center border-b border-slate-100 pb-2"><span class="text-slate-600">Purchase Return</span><span class="font-mono font-medium text-rose-600">৳ 2,100</span></div>
            <div class="flex justify-between items-center border-b border-slate-100 pb-2"><span class="text-slate-600">Due Payment Received</span><span class="font-mono font-medium theme-total-text">৳ 12,600</span></div>
            <div class="flex justify-between items-center border-b border-slate-100 pb-2"><span class="text-slate-600">Due Purchase Paid</span><span class="font-mono font-medium theme-total-text">৳ 9,800</span></div>
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
              <p class="font-semibold text-amber-900 m-0">Near-Expiry Warning (14 Batches)</p>
              <p class="text-amber-700 mt-0.5 m-0">
                Batches reaching shelf expiry within 30 days. Estimated capital at risk: ৳ 18,450.
              </p>
            </div>
            <a routerLink="/products/expired" nz-button nzSize="small" nzType="default" class="text-xs font-medium border-amber-300 text-amber-800">
              Review
            </a>
          </div>

          <div class="p-3 bg-rose-50 rounded-lg border border-rose-200 flex items-start gap-3">
            <span nz-icon nzType="close-circle" class="text-rose-500 text-lg mt-0.5"></span>
            <div class="flex-1 text-xs">
              <p class="font-semibold text-rose-900 m-0">Out of Stock & Shortages (8 Items)</p>
              <p class="text-rose-700 mt-0.5 m-0">
                8 high-demand items are currently below minimum reorder threshold.
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
export class DashboardComponent {
  readonly authService = inject(AuthService);
  readonly businessModes = BUSINESS_MODE_OPTIONS;
  selectedMode: number = BusinessMode.Retail;
  selectedBranch = 'all';

  readonly kpiStats: readonly KpiStat[] = [
    { title: 'Current Cash Balance', value: '৳ 84,250', icon: 'dollar', colorClass: 'theme-avatar', change: '↑ 12.4%', isPositive: true },
    { title: 'Bank Balance', value: '৳ 3,42,000', icon: 'bank', colorClass: 'bg-blue-50 text-blue-600' },
    { title: 'MFS Balance', value: '৳ 18,750', icon: 'swap', colorClass: 'bg-purple-50 text-purple-600' },
    { title: "Today's Sale", value: '৳ 24,380', icon: 'fund', colorClass: 'bg-emerald-50 text-emerald-600', change: '↑ 8.2%', isPositive: true },
    { title: "Today's Purchase", value: '৳ 17,900', icon: 'shopping-cart', colorClass: 'bg-amber-50 text-amber-600' },
    { title: 'Full Inventory Cost', value: '৳ 12,84,600', icon: 'shop', colorClass: 'theme-avatar' },
    { title: 'Total Items (SKU)', value: '1,248', subtext: 'Distinct products', icon: 'medicine-box', colorClass: 'bg-pink-50 text-pink-600' },
    { title: 'Total Product Count', value: '48,320', subtext: 'Physical units', icon: 'barcode', colorClass: 'theme-avatar' },
  ];

  readonly topSelling: readonly TopProduct[] = [
    { name: 'Napa 500mg Tablet', generic: 'Paracetamol', qty: 1240, total: '৳ 1,240' },
    { name: 'Seclo 20mg Capsule', generic: 'Omeprazole', qty: 860, total: '৳ 4,300' },
    { name: 'Amoxi 500mg Capsule', generic: 'Amoxicillin', qty: 720, total: '৳ 5,760' },
    { name: 'Metformin 500mg Tab', generic: 'Metformin HCl', qty: 640, total: '৳ 2,560' },
    { name: 'Cef-3 250mg Capsule', generic: 'Cefixime', qty: 520, total: '৳ 7,800' },
  ];

  readonly lowestSelling: readonly TopProduct[] = [
    { name: 'Rhinocort 64mcg Inhaler', generic: 'Budesonide', qty: 12, total: '৳ 3,600' },
    { name: 'Sandimmun 25mg Cap', generic: 'Cyclosporine', qty: 8, total: '৳ 2,400' },
    { name: 'Gleevec 100mg Tab', generic: 'Imatinib', qty: 6, total: '৳ 4,200' },
    { name: 'Enbrel 25mg Injection', generic: 'Etanercept', qty: 3, total: '৳ 8,100' },
  ];

  readonly areaChartData: ChartConfiguration['data'] = {
    labels: ['Sep 10', 'Sep 11', 'Sep 12', 'Sep 13', 'Sep 14', 'Sep 15', 'Sep 16'],
    datasets: [
      {
        data: [18200, 21500, 16800, 24300, 19700, 22100, 17900],
        label: 'Buy Price',
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        data: [6400, 7100, 5900, 8200, 7600, 8800, 6700],
        label: 'Gross Profit',
        borderColor: '#0d9488',
        backgroundColor: 'rgba(13, 148, 136, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  readonly areaChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true } }
  };

  readonly barChartData: ChartConfiguration['data'] = {
    labels: ['Sep 10', 'Sep 11', 'Sep 12', 'Sep 13', 'Sep 14', 'Sep 15', 'Sep 16'],
    datasets: [
      {
        data: [4200, 5100, 3900, 6200, 5600, 6800, 4700],
        label: 'Net Profit',
        backgroundColor: '#0d9488'
      },
      {
        data: [2200, 2000, 2000, 2000, 2000, 2000, 2000],
        label: 'Op Cost',
        backgroundColor: '#f59e0b'
      }
    ]
  };

  readonly barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true, stacked: true }, x: { stacked: true } }
  };
}

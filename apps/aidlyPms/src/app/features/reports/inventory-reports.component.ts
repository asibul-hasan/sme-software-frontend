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
import {
  ReportService,
  AbcFsnItem,
  ProductMarginItem,
  ExpiryBucketReport,
  DailyReturnsReport,
} from '../../core/services/report.service';

type ReportTab = 'abc-fsn' | 'margin' | 'expiry' | 'returns';

@Component({
  selector: 'app-inventory-reports',
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
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Inventory & Operational Reports"
        subtitle="ABC/FSN matrix, profit margin breakdown, expiry risk buckets, and daily return audits"
        formId="REP_1611"
        [breadcrumbs]="[
          { label: 'Products', url: '/products/list' },
          { label: 'Reports' }
        ]"
      >
        <div actions class="flex items-center gap-2">
          <div class="inline-flex rounded-md shadow-xs bg-slate-100 p-0.5">
            <button
              type="button"
              (click)="selectTab('abc-fsn')"
              [class]="currentTab() === 'abc-fsn' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'"
              class="px-3 py-1.5 text-xs rounded transition-all"
            >
              ABC / FSN Matrix
            </button>
            <button
              type="button"
              (click)="selectTab('margin')"
              [class]="currentTab() === 'margin' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'"
              class="px-3 py-1.5 text-xs rounded transition-all"
            >
              Margin Analysis
            </button>
            <button
              type="button"
              (click)="selectTab('expiry')"
              [class]="currentTab() === 'expiry' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'"
              class="px-3 py-1.5 text-xs rounded transition-all"
            >
              Expiry Buckets
            </button>
            <button
              type="button"
              (click)="selectTab('returns')"
              [class]="currentTab() === 'returns' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'"
              class="px-3 py-1.5 text-xs rounded transition-all"
            >
              Daily Returns
            </button>
          </div>
        </div>
      </app-page-header>

      <!-- TAB 1: ABC / FSN ANALYSIS -->
      <div *ngIf="currentTab() === 'abc-fsn'" class="flex-1 bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden flex flex-col p-3">
        <div class="flex items-center justify-between pb-3 border-b border-slate-200">
          <div class="flex items-center gap-3">
            <div class="w-64">
              <input
                type="text"
                nz-input
                placeholder="Search product or generic..."
                [(ngModel)]="abcSearch"
              />
            </div>
            <div class="flex items-center gap-1.5 text-xs text-slate-600">
              <span>Timeframe:</span>
              <nz-select [(ngModel)]="abcDays" (ngModelChange)="loadAbcFsn()" style="width: 130px;">
                <nz-option [nzValue]="30" nzLabel="Last 30 Days"></nz-option>
                <nz-option [nzValue]="60" nzLabel="Last 60 Days"></nz-option>
                <nz-option [nzValue]="90" nzLabel="Last 90 Days"></nz-option>
                <nz-option [nzValue]="180" nzLabel="Last 180 Days"></nz-option>
                <nz-option [nzValue]="365" nzLabel="Last 1 Year"></nz-option>
              </nz-select>
            </div>
          </div>
          <button nz-button (click)="loadAbcFsn()">
            <i nz-icon nzType="reload"></i> Refresh
          </button>
        </div>

        <div class="flex-1 overflow-auto pt-2 w-full max-w-full">
          <table class="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead>
              <tr class="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                <th class="p-2">#</th>
                <th class="p-2">Product Name</th>
                <th class="p-2">Generic</th>
                <th class="p-2">Company</th>
                <th class="p-2 text-right">Stock</th>
                <th class="p-2 text-right">Sold Qty</th>
                <th class="p-2 text-right">Revenue</th>
                <th class="p-2 text-center">ABC Class</th>
                <th class="p-2 text-center">FSN Velocity</th>
                <th class="p-2 text-right">Turnover</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let item of filteredAbcItems(); let idx = index" class="hover:bg-slate-50">
                <td class="p-2 text-slate-400">{{ idx + 1 }}</td>
                <td class="p-2 font-medium text-slate-800">{{ item.product_name }}</td>
                <td class="p-2 text-slate-600">{{ item.generic_name || 'N/A' }}</td>
                <td class="p-2 text-slate-600">{{ item.company_name || 'N/A' }}</td>
                <td class="p-2 text-right font-mono">{{ item.current_stock_pcs }}</td>
                <td class="p-2 text-right font-mono font-bold">{{ item.units_sold }}</td>
                <td class="p-2 text-right font-mono font-bold text-slate-900">৳{{ item.total_revenue | number:'1.2-2' }}</td>
                <td class="p-2 text-center">
                  <nz-tag *ngIf="item.abc_classification === 'A'" nzColor="success" class="font-bold">A (Top 70%)</nz-tag>
                  <nz-tag *ngIf="item.abc_classification === 'B'" nzColor="processing" class="font-bold">B (Next 20%)</nz-tag>
                  <nz-tag *ngIf="item.abc_classification === 'C'" nzColor="default" class="font-bold">C (Tail 10%)</nz-tag>
                </td>
                <td class="p-2 text-center">
                  <nz-tag *ngIf="item.fsn_velocity === 'Fast-Moving'" nzColor="magenta">Fast-Moving</nz-tag>
                  <nz-tag *ngIf="item.fsn_velocity === 'Slow-Moving'" nzColor="warning">Slow-Moving</nz-tag>
                  <nz-tag *ngIf="item.fsn_velocity === 'Non-Moving'" nzColor="default">Non-Moving</nz-tag>
                </td>
                <td class="p-2 text-right font-mono text-slate-700">{{ item.turnover_rate | number:'1.2-2' }}x</td>
              </tr>
              <tr *ngIf="filteredAbcItems().length === 0 && !isLoading()">
                <td colspan="10" class="p-8 text-center text-slate-400">No items match the filter.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 2: MARGIN ANALYSIS -->
      <div *ngIf="currentTab() === 'margin'" class="flex-1 bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden flex flex-col p-3">
        <div class="flex items-center justify-between pb-3 border-b border-slate-200">
          <div class="w-72">
            <input
              type="text"
              nz-input
              placeholder="Search product, company..."
              [(ngModel)]="marginSearch"
            />
          </div>
          <button nz-button (click)="loadMarginAnalysis()">
            <i nz-icon nzType="reload"></i> Refresh
          </button>
        </div>

        <div class="flex-1 overflow-auto pt-2 w-full max-w-full">
          <table class="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead>
              <tr class="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                <th class="p-2">#</th>
                <th class="p-2">Product Name</th>
                <th class="p-2">Company</th>
                <th class="p-2 text-right">Trade Price (Cost)</th>
                <th class="p-2 text-right">MRP (Sale Price)</th>
                <th class="p-2 text-right">Profit / Unit</th>
                <th class="p-2 text-right">Margin %</th>
                <th class="p-2 text-right">Units Sold</th>
                <th class="p-2 text-right">Total Realized Profit</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let m of filteredMarginItems(); let idx = index" class="hover:bg-slate-50">
                <td class="p-2 text-slate-400">{{ idx + 1 }}</td>
                <td class="p-2 font-medium text-slate-800">{{ m.product_name }}</td>
                <td class="p-2 text-slate-600">{{ m.company_name || 'N/A' }}</td>
                <td class="p-2 text-right font-mono">৳{{ m.trade_price_cost | number:'1.2-2' }}</td>
                <td class="p-2 text-right font-mono">৳{{ m.mrp_sale_price | number:'1.2-2' }}</td>
                <td class="p-2 text-right font-mono font-semibold text-emerald-700">৳{{ m.profit_per_unit | number:'1.2-2' }}</td>
                <td class="p-2 text-right font-mono font-bold" [class.text-emerald-700]="m.margin_percent >= 15" [class.text-amber-600]="m.margin_percent < 15">
                  {{ m.margin_percent | number:'1.1-1' }}%
                </td>
                <td class="p-2 text-right font-mono">{{ m.total_units_sold }}</td>
                <td class="p-2 text-right font-mono font-extrabold text-indigo-700">৳{{ m.total_realized_profit | number:'1.2-2' }}</td>
              </tr>
              <tr *ngIf="filteredMarginItems().length === 0 && !isLoading()">
                <td colspan="9" class="p-8 text-center text-slate-400">No margin records found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 3: EXPIRY BUCKETS -->
      <div *ngIf="currentTab() === 'expiry'" class="flex-1 flex flex-col space-y-3 min-h-0 overflow-hidden">
        <!-- Summary Cards -->
        <div class="grid grid-cols-5 gap-3" *ngIf="expiryReport()?.summary as s">
          <div class="bg-rose-50 border border-rose-200 rounded-lg p-3">
            <span class="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">Expired Stock</span>
            <span class="text-xl font-extrabold text-rose-800 mt-1 block">{{ s.expired_count }} batches</span>
            <span class="text-xs font-mono text-rose-600 block mt-0.5">৳{{ s.expired_cost_value | number:'1.2-2' }}</span>
          </div>
          <div class="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <span class="text-[11px] font-bold text-orange-700 uppercase tracking-wider block">Critical (0-30 Days)</span>
            <span class="text-xl font-extrabold text-orange-800 mt-1 block">{{ s.critical_30_count }} batches</span>
            <span class="text-xs font-mono text-orange-600 block mt-0.5">৳{{ s.critical_30_cost_value | number:'1.2-2' }}</span>
          </div>
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <span class="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Moderate (31-60 Days)</span>
            <span class="text-xl font-extrabold text-amber-800 mt-1 block">{{ s.moderate_60_count }} batches</span>
            <span class="text-xs font-mono text-amber-600 block mt-0.5">৳{{ s.moderate_60_cost_value | number:'1.2-2' }}</span>
          </div>
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <span class="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Approaching (61-90 Days)</span>
            <span class="text-xl font-extrabold text-blue-800 mt-1 block">{{ s.approaching_90_count }} batches</span>
            <span class="text-xs font-mono text-blue-600 block mt-0.5">৳{{ s.approaching_90_cost_value | number:'1.2-2' }}</span>
          </div>
          <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <span class="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">Total At-Risk Cost</span>
            <span class="text-xl font-extrabold text-indigo-800 mt-1 block">{{ s.total_at_risk_count }} batches</span>
            <span class="text-xs font-mono font-bold text-indigo-700 block mt-0.5">৳{{ s.total_at_risk_cost_value | number:'1.2-2' }}</span>
          </div>
        </div>

        <div class="flex-1 bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden flex flex-col p-3">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200">
            <div class="flex items-center gap-3">
              <div class="w-64">
                <input
                  type="text"
                  nz-input
                  placeholder="Filter product or batch #..."
                  [(ngModel)]="expirySearch"
                />
              </div>
              <nz-select [(ngModel)]="expiryBucketFilter" style="width: 160px;">
                <nz-option [nzValue]="'all'" nzLabel="All Risk Buckets"></nz-option>
                <nz-option [nzValue]="'Expired'" nzLabel="Expired"></nz-option>
                <nz-option [nzValue]="'0-30 Days'" nzLabel="0-30 Days"></nz-option>
                <nz-option [nzValue]="'31-60 Days'" nzLabel="31-60 Days"></nz-option>
                <nz-option [nzValue]="'61-90 Days'" nzLabel="61-90 Days"></nz-option>
              </nz-select>
            </div>
            <button nz-button (click)="loadExpiryBuckets()">
              <i nz-icon nzType="reload"></i> Refresh
            </button>
          </div>

          <div class="flex-1 overflow-auto pt-2 w-full max-w-full">
            <table class="w-full text-left text-xs border-collapse min-w-[760px]">
              <thead>
                <tr class="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                  <th class="p-2">Product Name</th>
                  <th class="p-2">Batch #</th>
                  <th class="p-2">Expiry Date</th>
                  <th class="p-2 text-right">Days Left</th>
                  <th class="p-2 text-right">Quantity</th>
                  <th class="p-2 text-right">Unit Cost</th>
                  <th class="p-2 text-right">Total Cost</th>
                  <th class="p-2">Rak #</th>
                  <th class="p-2 text-center">Bucket</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let b of filteredExpiryBatches()" class="hover:bg-slate-50">
                  <td class="p-2 font-medium text-slate-800">{{ b.product_name }}</td>
                  <td class="p-2 font-mono">{{ b.batch_number }}</td>
                  <td class="p-2 font-mono text-slate-600">{{ b.expiry_date | date:'dd MMM yyyy' }}</td>
                  <td class="p-2 text-right font-mono font-bold" [class.text-rose-600]="b.days_until_expiry <= 0" [class.text-orange-600]="b.days_until_expiry > 0 && b.days_until_expiry <= 30">
                    {{ b.days_until_expiry <= 0 ? 'EXPIRED' : b.days_until_expiry + 'd' }}
                  </td>
                  <td class="p-2 text-right font-mono">{{ b.quantity_pcs }} pcs</td>
                  <td class="p-2 text-right font-mono">৳{{ b.unit_cost_price | number:'1.2-2' }}</td>
                  <td class="p-2 text-right font-mono font-bold text-slate-900">৳{{ b.total_cost_value | number:'1.2-2' }}</td>
                  <td class="p-2 text-slate-500">{{ b.rak_number || '-' }}</td>
                  <td class="p-2 text-center">
                    <nz-tag *ngIf="b.bucket === 'Expired'" nzColor="error">Expired</nz-tag>
                    <nz-tag *ngIf="b.bucket === '0-30 Days'" nzColor="volcano">0-30 Days</nz-tag>
                    <nz-tag *ngIf="b.bucket === '31-60 Days'" nzColor="gold">31-60 Days</nz-tag>
                    <nz-tag *ngIf="b.bucket === '61-90 Days'" nzColor="cyan">61-90 Days</nz-tag>
                  </td>
                </tr>
                <tr *ngIf="filteredExpiryBatches().length === 0 && !isLoading()">
                  <td colspan="9" class="p-8 text-center text-slate-400">No batch items match the selected expiry risk filter.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 4: DAILY RETURNS -->
      <div *ngIf="currentTab() === 'returns'" class="flex-1 bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden flex flex-col p-3">
        <div class="flex items-center justify-between pb-3 border-b border-slate-200">
          <div class="flex items-center gap-3">
            <span class="text-xs text-slate-600 font-medium">Select Date:</span>
            <input
              type="date"
              [(ngModel)]="returnsDate"
              (ngModelChange)="loadDailyReturns()"
              class="px-2 py-1 text-xs border border-slate-300 rounded"
            />
          </div>
          <button nz-button (click)="loadDailyReturns()">
            <i nz-icon nzType="reload"></i> Refresh
          </button>
        </div>

        <div class="grid grid-cols-3 gap-3 my-2" *ngIf="dailyReturnsReport() as r">
          <div class="p-3 bg-slate-50 rounded border border-slate-200 text-xs">
            <span class="text-slate-500">Total Returns Count</span>
            <p class="text-lg font-bold text-slate-800 mt-1">{{ r.total_returns_count }}</p>
          </div>
          <div class="p-3 bg-rose-50 rounded border border-rose-200 text-xs">
            <span class="text-rose-600">Total Refund Amount</span>
            <p class="text-lg font-bold text-rose-700 mt-1">৳{{ r.total_refund_amount | number:'1.2-2' }}</p>
          </div>
          <div class="p-3 bg-amber-50 rounded border border-amber-200 text-xs">
            <span class="text-amber-600">Total Cash Paid Refund</span>
            <p class="text-lg font-bold text-amber-700 mt-1">৳{{ r.total_cash_refund | number:'1.2-2' }}</p>
          </div>
        </div>

        <div class="flex-1 overflow-auto pt-2 w-full max-w-full">
          <table class="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead>
              <tr class="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                <th class="p-2">Return #</th>
                <th class="p-2">Original Sale #</th>
                <th class="p-2">Customer</th>
                <th class="p-2">Return Time</th>
                <th class="p-2 text-right">Items</th>
                <th class="p-2 text-right">Refund Amount</th>
                <th class="p-2 text-right">Cash Paid</th>
                <th class="p-2">Exchange #</th>
                <th class="p-2">Processed By</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let ret of (dailyReturnsReport()?.items || [])" class="hover:bg-slate-50">
                <td class="p-2 font-mono font-bold text-indigo-700">{{ ret.return_number }}</td>
                <td class="p-2 font-mono text-slate-600">{{ ret.sales_number }}</td>
                <td class="p-2 font-medium text-slate-800">{{ ret.customer_name }}</td>
                <td class="p-2 text-slate-600">{{ ret.return_date | date:'hh:mm a' }}</td>
                <td class="p-2 text-right font-mono">{{ ret.total_items }}</td>
                <td class="p-2 text-right font-mono font-bold text-rose-700">৳{{ ret.final_refund_price | number:'1.2-2' }}</td>
                <td class="p-2 text-right font-mono text-amber-700">৳{{ ret.cash_paid_refund | number:'1.2-2' }}</td>
                <td class="p-2 font-mono text-slate-500">{{ ret.exchange_sales_number || '-' }}</td>
                <td class="p-2 text-slate-600">{{ ret.created_by_user_name || '-' }}</td>
              </tr>
              <tr *ngIf="(dailyReturnsReport()?.items || []).length === 0 && !isLoading()">
                <td colspan="9" class="p-8 text-center text-slate-400">No returns logged for this date.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class InventoryReportsComponent implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly msg = inject(NzMessageService);

  currentTab = signal<ReportTab>('abc-fsn');
  isLoading = signal(false);

  // Tab 1: ABC/FSN
  abcDays = 90;
  abcSearch = '';
  abcItems = signal<AbcFsnItem[]>([]);

  // Tab 2: Margin
  marginSearch = '';
  marginItems = signal<ProductMarginItem[]>([]);

  // Tab 3: Expiry
  expirySearch = '';
  expiryBucketFilter = 'all';
  expiryReport = signal<ExpiryBucketReport | null>(null);

  // Tab 4: Returns
  returnsDate = new Date().toISOString().slice(0, 10);
  dailyReturnsReport = signal<DailyReturnsReport | null>(null);

  filteredAbcItems = computed(() => {
    const q = this.abcSearch.trim().toLowerCase();
    if (!q) return this.abcItems();
    return this.abcItems().filter(
      i =>
        i.product_name.toLowerCase().includes(q) ||
        (i.generic_name && i.generic_name.toLowerCase().includes(q)) ||
        (i.company_name && i.company_name.toLowerCase().includes(q))
    );
  });

  filteredMarginItems = computed(() => {
    const q = this.marginSearch.trim().toLowerCase();
    if (!q) return this.marginItems();
    return this.marginItems().filter(
      m =>
        m.product_name.toLowerCase().includes(q) ||
        (m.company_name && m.company_name.toLowerCase().includes(q))
    );
  });

  filteredExpiryBatches = computed(() => {
    const r = this.expiryReport();
    if (!r) return [];
    let list = r.items || [];
    if (this.expiryBucketFilter !== 'all') {
      list = list.filter(b => b.bucket === this.expiryBucketFilter);
    }
    const q = this.expirySearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        b =>
          b.product_name.toLowerCase().includes(q) ||
          b.batch_number.toLowerCase().includes(q)
      );
    }
    return list;
  });

  ngOnInit(): void {
    this.loadAbcFsn();
  }

  selectTab(tab: ReportTab): void {
    this.currentTab.set(tab);
    if (tab === 'abc-fsn' && this.abcItems().length === 0) {
      this.loadAbcFsn();
    } else if (tab === 'margin' && this.marginItems().length === 0) {
      this.loadMarginAnalysis();
    } else if (tab === 'expiry' && !this.expiryReport()) {
      this.loadExpiryBuckets();
    } else if (tab === 'returns' && !this.dailyReturnsReport()) {
      this.loadDailyReturns();
    }
  }

  loadAbcFsn(): void {
    this.isLoading.set(true);
    this.reportService.getAbcFsn(this.abcDays).subscribe({
      next: res => {
        this.isLoading.set(false);
        this.abcItems.set(res.data || []);
      },
      error: () => this.isLoading.set(false),
    });
  }

  loadMarginAnalysis(): void {
    this.isLoading.set(true);
    this.reportService.getMarginAnalysis().subscribe({
      next: res => {
        this.isLoading.set(false);
        this.marginItems.set(res.data || []);
      },
      error: () => this.isLoading.set(false),
    });
  }

  loadExpiryBuckets(): void {
    this.isLoading.set(true);
    this.reportService.getExpiryBuckets().subscribe({
      next: res => {
        this.isLoading.set(false);
        this.expiryReport.set(res.data || null);
      },
      error: () => this.isLoading.set(false),
    });
  }

  loadDailyReturns(): void {
    this.isLoading.set(true);
    this.reportService.getDailyReturns(this.returnsDate).subscribe({
      next: res => {
        this.isLoading.set(false);
        this.dailyReturnsReport.set(res.data || null);
      },
      error: () => this.isLoading.set(false),
    });
  }
}

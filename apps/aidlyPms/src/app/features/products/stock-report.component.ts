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
import { NzPaginationModule } from 'ng-zorro-antd/pagination';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ProductService } from '../../core/services/product.service';
import { StockReportSummary, StockReportItem, ProdCompany } from '../../core/models/product.models';

type StockStatusFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

@Component({
  selector: 'app-stock-report',
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
    NzPaginationModule,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <!-- Page Header -->
      <app-page-header
        title="Stock Valuation & Inventory Report"
        subtitle="Current stock levels, stock valuation at cost and MRP, and stock shortage alerts"
        formId="PROD_1611"
        [breadcrumbs]="[
          { label: 'Medicines & Stock', url: '/products/list' },
          { label: 'Stock Reports' }
        ]"
      >
        <!-- Filter Toolbar -->
        <div filters class="flex items-end gap-2 shrink-0 flex-nowrap py-1">
          <!-- Status Preset Segmented Filter -->
          <div class="flex flex-col">
            <label for="stock-report-all-manufacturers-2" class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Stock Status</label>
            <div class="inline-flex rounded-md shadow-xs bg-slate-100 p-0.5" role="group">
              <button
                type="button"
                (click)="setStatusFilter('all')"
                class="px-2.5 py-1 text-xs font-semibold rounded transition-colors"
                [ngClass]="activeStatus === 'all' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'"
              >
                All Products
              </button>
              <button
                type="button"
                (click)="setStatusFilter('in_stock')"
                class="px-2.5 py-1 text-xs font-semibold rounded transition-colors"
                [ngClass]="activeStatus === 'in_stock' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'"
              >
                In Stock
              </button>
              <button
                type="button"
                (click)="setStatusFilter('low_stock')"
                class="px-2.5 py-1 text-xs font-semibold rounded transition-colors inline-flex items-center gap-1"
                [ngClass]="activeStatus === 'low_stock' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'"
              >
                <span nz-icon nzType="warning" nzTheme="outline" class="text-[11px]"></span>
                Low Stock
              </button>
              <button
                type="button"
                (click)="setStatusFilter('out_of_stock')"
                class="px-2.5 py-1 text-xs font-semibold rounded transition-colors inline-flex items-center gap-1"
                [ngClass]="activeStatus === 'out_of_stock' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'"
              >
                <span nz-icon nzType="close-circle" nzTheme="outline" class="text-[11px]"></span>
                Out of Stock
              </button>
            </div>
          </div>

          <!-- Company / Manufacturer Filter -->
          <div class="flex flex-col">
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Manufacturer</label>
            <nz-select id="stock-report-all-manufacturers-2" nzId="stock-report-all-manufacturers-2"
              [(ngModel)]="selectedCompanyNo"
              (ngModelChange)="onFilterChange()"
              class="w-48 shrink-0 rounded-md text-xs"
              nzShowSearch
              nzAllowClear
              nzPlaceHolder="All Manufacturers" aria-label="All Manufacturers">
              <nz-option [nzValue]="0" nzLabel="All Manufacturers"></nz-option>
              @for (c of companies(); track c.company_no) {
                <nz-option [nzValue]="c.company_no" [nzLabel]="c.name"></nz-option>
              }
            </nz-select>
          </div>

          <!-- Search Input -->
          <div class="flex flex-col">
            <label for="stock-report-search-1" class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Search</label>
            <nz-input-group [nzPrefix]="searchIcon" class="w-48 shrink-0 rounded-md">
              <input id="stock-report-search-1"
                type="text"
                nz-input
                placeholder="Product, generic, barcode..."
                [(ngModel)]="searchQuery"
                (keyup.enter)="onFilterChange()"
                class="text-xs" aria-label="Search" />
            </nz-input-group>
            <ng-template #searchIcon>
              <span nz-icon nzType="search" class="text-slate-400"></span>
            </ng-template>
          </div>

          <button
            nz-button
            nzType="primary"
            class="rounded-md h-8 px-3 text-xs shrink-0 inline-flex items-center gap-1 font-semibold"
            (click)="onFilterChange()"
          >
            <span nz-icon nzType="filter"></span> Apply
          </button>

          <button
            nz-button
            nzType="default"
            class="rounded-md h-8 px-2.5 text-xs shrink-0 inline-flex items-center gap-1 text-slate-600 hover:text-slate-900"
            (click)="resetFilters()"
          >
            <span nz-icon nzType="clear"></span> Reset
          </button>
        </div>

        <!-- Header Actions -->
        <div actions class="flex items-center gap-2 shrink-0 flex-nowrap">
          <a
            routerLink="/products/requisition"
            nz-button
            class="rounded-md h-8 px-3 text-xs font-semibold bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 inline-flex items-center gap-1.5"
            nz-tooltip
            nzTooltipTitle="Create requisition for low stock items"
           aria-label="Create requisition for low stock items">
            <span nz-icon nzType="shopping-cart"></span> Requisition
          </a>

          <button
            nz-button
            nzType="default"
            class="rounded-md h-8 px-3 text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
            (click)="exportCsv()"
          >
            <span nz-icon nzType="download"></span> Export CSV
          </button>

          <button
            nz-button
            nzType="default"
            class="rounded-md h-8 px-3 text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
            (click)="printReport()"
          >
            <span nz-icon nzType="printer"></span> Print
          </button>

          <button
            nz-button
            nzType="default"
            class="rounded-md h-8 px-2.5 text-xs text-slate-600 inline-flex items-center"
            (click)="loadReport()"
            nz-tooltip
            nzTooltipTitle="Refresh Data"
           aria-label="Refresh Data">
            <span nz-icon nzType="reload" [nzSpin]="isLoading()"></span>
          </button>
        </div>
      </app-page-header>

      <!-- KPI Summary Cards Banner -->
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 shrink-0">
        <!-- Total Products -->
        <div class="bg-white rounded-lg border border-slate-200 p-2.5 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between text-slate-500 mb-1">
            <span class="text-[11px] font-semibold uppercase tracking-wider">Catalog Items</span>
            <span nz-icon nzType="medicine-box" class="text-slate-400 text-sm"></span>
          </div>
          <div class="flex items-baseline justify-between">
            <span class="text-lg font-bold text-slate-900 font-mono leading-none">
              {{ summary()?.total_products || 0 }}
            </span>
            <span class="text-[11px] text-slate-500 font-medium">
              {{ summary()?.total_stock_pcs || 0 | number }} pcs
            </span>
          </div>
        </div>

        <!-- In Stock -->
        <div class="bg-white rounded-lg border border-emerald-200 bg-emerald-50/20 p-2.5 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between text-emerald-700 mb-1">
            <span class="text-[11px] font-semibold uppercase tracking-wider">In Stock</span>
            <span nz-icon nzType="check-circle" class="text-emerald-500 text-sm"></span>
          </div>
          <div class="flex items-baseline justify-between">
            <span class="text-lg font-bold text-emerald-700 font-mono leading-none">
              {{ summary()?.in_stock_items || 0 }}
            </span>
            <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Active
            </span>
          </div>
        </div>

        <!-- Low Stock -->
        <div class="bg-white rounded-lg border border-amber-200 bg-amber-50/20 p-2.5 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between text-amber-700 mb-1">
            <span class="text-[11px] font-semibold uppercase tracking-wider">Low Stock</span>
            <span nz-icon nzType="warning" class="text-amber-500 text-sm"></span>
          </div>
          <div class="flex items-baseline justify-between">
            <span class="text-lg font-bold text-amber-700 font-mono leading-none">
              {{ summary()?.low_stock_items || 0 }}
            </span>
            <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
              Needs Order
            </span>
          </div>
        </div>

        <!-- Out of Stock -->
        <div class="bg-white rounded-lg border border-rose-200 bg-rose-50/20 p-2.5 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between text-rose-700 mb-1">
            <span class="text-[11px] font-semibold uppercase tracking-wider">Out of Stock</span>
            <span nz-icon nzType="close-circle" class="text-rose-500 text-sm"></span>
          </div>
          <div class="flex items-baseline justify-between">
            <span class="text-lg font-bold text-rose-700 font-mono leading-none">
              {{ summary()?.out_of_stock_items || 0 }}
            </span>
            <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
              0 Qty
            </span>
          </div>
        </div>

        <!-- Valuation at Cost -->
        <div class="bg-white rounded-lg border border-slate-200 p-2.5 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between text-slate-500 mb-1">
            <span class="text-[11px] font-semibold uppercase tracking-wider">Cost Valuation</span>
            <span nz-icon nzType="calculator" class="text-slate-400 text-sm"></span>
          </div>
          <div>
            <span class="text-base font-bold text-slate-900 font-mono leading-none block">
              ৳ {{ summary()?.total_cost_valuation || 0 | number: '1.2-2' }}
            </span>
            <span class="text-[10px] text-slate-400">Total Purchase Cost</span>
          </div>
        </div>

        <!-- Valuation at Sale MRP -->
        <div class="bg-white rounded-lg border border-sky-200 bg-sky-50/20 p-2.5 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between text-sky-700 mb-1">
            <span class="text-[11px] font-semibold uppercase tracking-wider">Retail Valuation</span>
            <span nz-icon nzType="dollar" class="text-sky-500 text-sm"></span>
          </div>
          <div>
            <span class="text-base font-bold text-sky-800 font-mono leading-none block">
              ৳ {{ summary()?.total_sale_valuation || 0 | number: '1.2-2' }}
            </span>
            <span class="text-[10px] text-sky-600 font-medium">Estimated MRP Value</span>
          </div>
        </div>

        <!-- Potential Profit -->
        <div class="bg-white rounded-lg border border-indigo-200 bg-indigo-50/20 p-2.5 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between text-indigo-700 mb-1">
            <span class="text-[11px] font-semibold uppercase tracking-wider">Potential Profit</span>
            <span nz-icon nzType="rise" class="text-indigo-500 text-sm"></span>
          </div>
          <div class="flex items-baseline justify-between">
            <span class="text-base font-bold text-indigo-700 font-mono leading-none">
              ৳ {{ summary()?.potential_profit || 0 | number: '1.2-2' }}
            </span>
            <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono">
              {{ overallProfitMargin() | number: '1.1-1' }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Main Table Card -->
      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <nz-spin [nzSpinning]="isLoading()" class="flex-1 min-h-0 flex flex-col">
          @if (items().length > 0) {
            <!-- Scrollable Table -->
            <div class="flex-1 min-h-0 overflow-auto">
              <table class="w-full text-left border-collapse text-xs print-table">
                <thead class="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider shadow-xs">
                  <tr>
                    <th class="p-2.5 w-10 text-center">#</th>
                    <th class="p-2.5 min-w-[200px]">Product / Formulation</th>
                    <th class="p-2.5 min-w-[130px]">Generic Name</th>
                    <th class="p-2.5 min-w-[120px]">Manufacturer</th>
                    <th class="p-2.5 w-20 text-center">Rack</th>
                    <th class="p-2.5 w-28 text-right">Current Stock</th>
                    <th class="p-2.5 w-20 text-center">Min Reorder</th>
                    <th class="p-2.5 w-24 text-right">Cost Price</th>
                    <th class="p-2.5 w-24 text-right">Sale Price</th>
                    <th class="p-2.5 w-28 text-right">Cost Valuation</th>
                    <th class="p-2.5 w-28 text-right">Retail Valuation</th>
                    <th class="p-2.5 w-20 text-right">Margin %</th>
                    <th class="p-2.5 w-24 text-center">Status</th>
                    <th class="p-2.5 w-16 text-center print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (item of items(); track item.product_no; let idx = $index) {
                    <tr class="hover:bg-slate-50/75 transition-colors">
                      <!-- # -->
                      <td class="p-2.5 text-center text-slate-400 font-mono">
                        {{ (pageIndex - 1) * pageSize + idx + 1 }}
                      </td>

                      <!-- Product Info -->
                      <td class="p-2.5">
                        <div class="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{{ item.product_name }}</span>
                          @if (item.strength) {
                            <span class="text-[10px] font-normal px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                              {{ item.strength }}
                            </span>
                          }
                        </div>
                        <div class="text-[11px] text-slate-400 mt-0.5">
                          Pack: {{ item.quantity_per_box }} pcs / box
                        </div>
                      </td>

                      <!-- Generic Name -->
                      <td class="p-2.5 text-slate-700">
                        {{ item.generic_name || '—' }}
                      </td>

                      <!-- Manufacturer -->
                      <td class="p-2.5 text-slate-600 font-medium">
                        {{ item.company_name || '—' }}
                      </td>

                      <!-- Rack -->
                      <td class="p-2.5 text-center">
                        <span class="inline-block px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {{ item.rak_number || '—' }}
                        </span>
                      </td>

                      <!-- Current Stock -->
                      <td class="p-2.5 text-right font-mono">
                        <span
                          class="font-bold text-xs block"
                          [ngClass]="{
                            'text-emerald-700': item.stock_status === 'in_stock',
                            'text-amber-700': item.stock_status === 'low_stock',
                            'text-rose-700': item.stock_status === 'out_of_stock'
                          }"
                        >
                          {{ item.current_stock_pcs }} pcs
                        </span>
                        <span class="text-[10px] text-slate-400">
                          {{ item.current_stock_boxes | number: '1.1-2' }} bxs
                        </span>
                      </td>

                      <!-- Min Reorder -->
                      <td class="p-2.5 text-center font-mono text-slate-500 text-xs">
                        {{ item.min_stock_qty_pcs }} pcs
                      </td>

                      <!-- Cost Price -->
                      <td class="p-2.5 text-right font-mono text-slate-600 text-xs">
                        ৳ {{ item.purchase_price_per_piece | number: '1.2-2' }}
                      </td>

                      <!-- Sale Price -->
                      <td class="p-2.5 text-right font-mono font-medium text-slate-800 text-xs">
                        ৳ {{ item.sale_price_per_piece | number: '1.2-2' }}
                      </td>

                      <!-- Cost Valuation -->
                      <td class="p-2.5 text-right font-mono text-xs font-semibold text-slate-900">
                        ৳ {{ item.cost_valuation | number: '1.2-2' }}
                      </td>

                      <!-- Retail Valuation -->
                      <td class="p-2.5 text-right font-mono text-xs font-semibold text-sky-800">
                        ৳ {{ item.sale_valuation | number: '1.2-2' }}
                      </td>

                      <!-- Profit Margin % -->
                      <td class="p-2.5 text-right font-mono text-xs font-medium" [ngClass]="item.profit_margin_pct >= 0 ? 'text-emerald-700' : 'text-rose-700'">
                        {{ item.profit_margin_pct | number: '1.1-1' }}%
                      </td>

                      <!-- Status Badge -->
                      <td class="p-2.5 text-center">
                        @if (item.stock_status === 'in_stock') {
                          <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            In Stock
                          </span>
                        } @else if (item.stock_status === 'low_stock') {
                          <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Low Stock
                          </span>
                        } @else {
                          <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Out of Stock
                          </span>
                        }
                      </td>

                      <!-- Quick Action -->
                      <td class="p-2.5 text-center print:hidden">
                        @if (item.stock_status !== 'in_stock') {
                          <a
                            routerLink="/products/requisition"
                            nz-tooltip
                            nzTooltipTitle="Reorder Shortfall in Requisition"
                            class="inline-flex items-center justify-center w-6 h-6 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                           aria-label="Reorder Shortfall in Requisition">
                            <span nz-icon nzType="plus" class="text-xs"></span>
                          </a>
                        } @else {
                          <span class="text-slate-300">—</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Sticky Table Footer with Totals and Pagination -->
            <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 font-medium">
              <!-- Summary breakdown of current view -->
              <div class="flex items-center gap-3">
                <span>
                  Showing <strong class="text-slate-900 font-mono">{{ (pageIndex - 1) * pageSize + 1 }}</strong>
                  to <strong class="text-slate-900 font-mono">{{ Math.min(pageIndex * pageSize, totalCount) }}</strong>
                  of <strong class="text-slate-900 font-mono">{{ totalCount }}</strong> products
                </span>
                <span class="text-slate-300">|</span>
                <span>Page Cost Value: <strong class="text-slate-900 font-mono font-bold">৳ {{ pageCostValuation() | number: '1.2-2' }}</strong></span>
                <span class="text-slate-300">|</span>
                <span>Page Retail Value: <strong class="text-sky-800 font-mono font-bold">৳ {{ pageSaleValuation() | number: '1.2-2' }}</strong></span>
              </div>

              <!-- Pagination Controls -->
              <div class="flex items-center gap-3">
                <nz-select id="stock-report-page-size-search-3" nzId="stock-report-page-size-search-3"
                  [(ngModel)]="pageSize"
                  (ngModelChange)="onPageSizeChange($event)"
                  class="w-24 text-xs"
                  nzSize="small" aria-label="Page Size Search">
                  <nz-option [nzValue]="50" nzLabel="50 / page"></nz-option>
                  <nz-option [nzValue]="100" nzLabel="100 / page"></nz-option>
                  <nz-option [nzValue]="200" nzLabel="200 / page"></nz-option>
                  <nz-option [nzValue]="500" nzLabel="500 / page"></nz-option>
                </nz-select>

                <nz-pagination
                  [nzPageIndex]="pageIndex"
                  [nzPageSize]="pageSize"
                  [nzTotal]="totalCount"
                  [nzShowSizeChanger]="false"
                  (nzPageIndexChange)="onPageIndexChange($event)"
                  nzSimple
                >
                </nz-pagination>
              </div>
            </div>
          } @else {
            <div class="flex-1 min-h-0 flex items-center justify-center p-8">
              <app-empty-state
                title="No inventory records found"
                description="No products match the selected stock status, company, or search filter."
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
        .table-sticky-footer,
        app-page-header,
        .print\\:hidden {
          display: none !important;
        }
        .print-table {
          width: 100% !important;
          border-collapse: collapse !important;
        }
        .print-table th,
        .print-table td {
          border: 1px solid #cbd5e1 !important;
          padding: 6px !important;
          font-size: 10px !important;
        }
      }
    `,
  ],
})
export class StockReportComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly msg = inject(NzMessageService);

  readonly Math = Math;

  // Filter States
  activeStatus: StockStatusFilter = 'all';
  selectedCompanyNo = 0;
  searchQuery = '';
  pageIndex = 1;
  pageSize = 100;

  // Data Signals
  isLoading = signal(false);
  summary = signal<StockReportSummary | null>(null);
  items = signal<StockReportItem[]>([]);
  totalCount = 0;
  companies = signal<ProdCompany[]>([]);

  // Computed values
  overallProfitMargin = computed(() => {
    const s = this.summary();
    if (!s || s.total_sale_valuation <= 0) return 0;
    return (s.potential_profit / s.total_sale_valuation) * 100;
  });

  pageCostValuation = computed(() => {
    return this.items().reduce((acc, item) => acc + (item.cost_valuation || 0), 0);
  });

  pageSaleValuation = computed(() => {
    return this.items().reduce((acc, item) => acc + (item.sale_valuation || 0), 0);
  });

  ngOnInit(): void {
    this.loadCompanies();
    this.loadReport();
  }

  loadCompanies(): void {
    this.productService.getCompanies().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.companies.set(res.data);
        }
      },
    });
  }

  loadReport(): void {
    this.isLoading.set(true);

    const params: Record<string, unknown> = {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
    };

    if (this.activeStatus && this.activeStatus !== 'all') {
      params['stockStatus'] = this.activeStatus;
    }

    if (this.selectedCompanyNo && this.selectedCompanyNo > 0) {
      params['companyNo'] = this.selectedCompanyNo;
    }

    if (this.searchQuery && this.searchQuery.trim()) {
      params['search'] = this.searchQuery.trim();
    }

    this.productService.getStockReport(params).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.summary.set(res.data.summary);
          this.items.set(res.data.items || []);
          this.totalCount = res.data.total_count || 0;
        } else {
          this.msg.error(res.message || 'Failed to load stock report data');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.msg.error(err.message || 'Network error while loading stock report');
      },
    });
  }

  setStatusFilter(status: StockStatusFilter): void {
    this.activeStatus = status;
    this.pageIndex = 1;
    this.loadReport();
  }

  onFilterChange(): void {
    this.pageIndex = 1;
    this.loadReport();
  }

  resetFilters(): void {
    this.activeStatus = 'all';
    this.selectedCompanyNo = 0;
    this.searchQuery = '';
    this.pageIndex = 1;
    this.loadReport();
  }

  onPageIndexChange(page: number): void {
    this.pageIndex = page;
    this.loadReport();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    this.loadReport();
  }

  exportCsv(): void {
    const list = this.items();
    if (!list.length) {
      this.msg.warning('No inventory data to export.');
      return;
    }

    const headers = [
      '#',
      'Product Name',
      'Strength',
      'Generic Name',
      'Manufacturer',
      'Rack #',
      'Pack Size (Pcs)',
      'Current Stock (Pcs)',
      'Current Stock (Boxes)',
      'Min Stock Level (Pcs)',
      'Purchase Price (BDT)',
      'Sale Price (BDT)',
      'Total Cost Valuation (BDT)',
      'Total Retail Valuation (BDT)',
      'Profit Margin %',
      'Stock Status',
    ];

    const rows = list.map((item, i) => [
      (this.pageIndex - 1) * this.pageSize + i + 1,
      `"${(item.product_name || '').replace(/"/g, '""')}"`,
      `"${item.strength || ''}"`,
      `"${(item.generic_name || '').replace(/"/g, '""')}"`,
      `"${(item.company_name || '').replace(/"/g, '""')}"`,
      `"${item.rak_number || ''}"`,
      item.quantity_per_box,
      item.current_stock_pcs,
      item.current_stock_boxes.toFixed(2),
      item.min_stock_qty_pcs,
      item.purchase_price_per_piece.toFixed(2),
      item.sale_price_per_piece.toFixed(2),
      item.cost_valuation.toFixed(2),
      item.sale_valuation.toFixed(2),
      item.profit_margin_pct.toFixed(2),
      `"${item.stock_status}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `inventory_stock_report_${this.activeStatus}_${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.msg.success(`Exported stock report CSV (${list.length} rows)`);
  }

  printReport(): void {
    window.print();
  }
}

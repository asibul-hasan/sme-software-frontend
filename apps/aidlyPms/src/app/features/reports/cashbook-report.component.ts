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
import {
  DashboardService,
  CashbookEntry,
  DailySalesTrend,
  FinancialReportSummary,
} from '../../core/services/dashboard.service';
import { AccountingService } from '../../core/services/accounting.service';
import { AccTransactionAccount, TrialBalanceRow } from '../../core/models/accounting.models';
import { formatDateToDdMmYyyy } from '../../shared/utils/date-range.util';

type DatePreset = 'today' | 'week' | 'month' | 'custom';

@Component({
  selector: 'app-cashbook-report',
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
        title="Cashbook & Buy/Sale Register"
        subtitle="Consolidated cash inflow/outflow register, daily reconciliation, and buy vs sale summary"
        formId="DASH_2303"
        [breadcrumbs]="[
          { label: 'Accounts & Cash', url: '/accounting/transaction' },
          { label: 'Reports', url: '/dashboard/cashbook' },
          { label: 'Cashbook & Buy/Sale Register' }
        ]"
      >
        <!-- Filter Toolbar -->
        <div filters class="flex items-end gap-2 shrink-0 flex-wrap py-1">
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
        <div actions class="flex items-center gap-2 shrink-0 flex-wrap">
          <a
            nz-button
            routerLink="/dashboard/analytics"
            class="rounded-md text-xs inline-flex items-center gap-1 text-slate-700"
          >
            <span nz-icon nzType="bar-chart"></span> Sales Performance
          </a>
          <button
            nz-button
            nzType="default"
            class="rounded-md text-xs inline-flex items-center gap-1"
            (click)="exportCurrentReportCsv()"
          >
            <span nz-icon nzType="download"></span> Export CSV
          </button>
          <button
            nz-button
            nzType="primary"
            class="rounded-md text-xs inline-flex items-center gap-1"
            (click)="printReport()"
          >
            <span nz-icon nzType="printer"></span> Print Statement
          </button>
        </div>
      </app-page-header>

      <!-- KPI Summary Cards Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5 shrink-0">
        <!-- 1. Total Sale -->
        <div class="bg-white rounded-xl border border-slate-200 p-2.5 shadow-xs flex flex-col justify-between">
          <span class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Sales</span>
          <div class="mt-1">
            <span class="font-mono text-base font-bold text-sky-700">৳ {{ summary()?.total_sales || 0 | number: '1.2-2' }}</span>
            <p class="text-[10px] text-slate-400 m-0">{{ summary()?.total_sales_count || 0 }} receipts</p>
          </div>
        </div>

        <!-- 2. Total Buy -->
        <div class="bg-white rounded-xl border border-slate-200 p-2.5 shadow-xs flex flex-col justify-between">
          <span class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Buy / Purchase</span>
          <div class="mt-1">
            <span class="font-mono text-base font-bold text-slate-800">৳ {{ summary()?.total_purchases || 0 | number: '1.2-2' }}</span>
            <p class="text-[10px] text-slate-400 m-0">Vendor invoices</p>
          </div>
        </div>

        <!-- 3. Gross Profit -->
        <div class="bg-white rounded-xl border border-emerald-200 bg-emerald-50/20 p-2.5 shadow-xs flex flex-col justify-between">
          <span class="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Gross Profit</span>
          <div class="mt-1">
            <span class="font-mono text-base font-bold text-emerald-700">৳ {{ summary()?.total_profit || 0 | number: '1.2-2' }}</span>
            <p class="text-[10px] text-emerald-600 m-0">Margin: {{ grossMarginPct }}%</p>
          </div>
        </div>

        <!-- 4. Operating Expenses -->
        <div class="bg-white rounded-xl border border-rose-200 bg-rose-50/20 p-2.5 shadow-xs flex flex-col justify-between">
          <span class="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">Expenses</span>
          <div class="mt-1">
            <span class="font-mono text-base font-bold text-rose-700">৳ {{ summary()?.total_expenses || 0 | number: '1.2-2' }}</span>
            <p class="text-[10px] text-rose-500 m-0">Operating cost</p>
          </div>
        </div>

        <!-- 5. Net Profit -->
        <div class="bg-white rounded-xl border border-slate-200 p-2.5 shadow-xs flex flex-col justify-between"
             [ngClass]="(summary()?.net_profit || 0) >= 0 ? 'bg-emerald-50/40 border-emerald-300' : 'bg-rose-50/40 border-rose-300'">
          <span class="text-[11px] font-semibold uppercase tracking-wider"
                [ngClass]="(summary()?.net_profit || 0) >= 0 ? 'text-emerald-800' : 'text-rose-800'">Net Profit</span>
          <div class="mt-1">
            <span class="font-mono text-base font-bold"
                  [ngClass]="(summary()?.net_profit || 0) >= 0 ? 'text-emerald-800' : 'text-rose-800'">
              ৳ {{ summary()?.net_profit || 0 | number: '1.2-2' }}
            </span>
            <p class="text-[10px] text-slate-500 m-0">Gross + Inc - Exp</p>
          </div>
        </div>

        <!-- 6. Total Cash In -->
        <div class="bg-white rounded-xl border border-slate-200 p-2.5 shadow-xs flex flex-col justify-between">
          <span class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Cash In</span>
          <div class="mt-1">
            <span class="font-mono text-base font-bold text-emerald-600">৳ {{ totalCashIn | number: '1.2-2' }}</span>
            <p class="text-[10px] text-slate-400 m-0">Sales + Dues + Inc</p>
          </div>
        </div>

        <!-- 7. Total Cash Out -->
        <div class="bg-white rounded-xl border border-slate-200 p-2.5 shadow-xs flex flex-col justify-between">
          <span class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Cash Out</span>
          <div class="mt-1">
            <span class="font-mono text-base font-bold text-rose-600">৳ {{ totalCashOut | number: '1.2-2' }}</span>
            <p class="text-[10px] text-slate-400 m-0">Suppliers + Exp</p>
          </div>
        </div>

        <!-- 8. Net Cash Flow -->
        <div class="bg-white rounded-xl border border-slate-200 p-2.5 shadow-xs flex flex-col justify-between">
          <span class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Net Cash Flow</span>
          <div class="mt-1">
            <span class="font-mono text-base font-bold" [ngClass]="netCashFlow >= 0 ? 'text-sky-700' : 'text-rose-600'">
              ৳ {{ netCashFlow | number: '1.2-2' }}
            </span>
            <p class="text-[10px] text-slate-400 m-0">Inflow - Outflow</p>
          </div>
        </div>
      </div>

      <!-- Main Content Container with Tabs -->
      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <!-- Tabs Bar & Secondary Filters -->
        <div class="shrink-0 px-4 pt-3 pb-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/60">
          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="activeTab = 'cashbook'"
              class="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors border-0 cursor-pointer inline-flex items-center gap-1.5"
              [ngClass]="activeTab === 'cashbook' ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200'"
            >
              <span nz-icon nzType="wallet"></span> Cashbook Ledger
              <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">{{ filteredCashbookEntries().length }}</span>
            </button>
            <button
              type="button"
              (click)="activeTab = 'reconciliation'"
              class="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors border-0 cursor-pointer inline-flex items-center gap-1.5"
              [ngClass]="activeTab === 'reconciliation' ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200'"
            >
              <span nz-icon nzType="swap"></span> Buy vs Sale Reconciliation
              <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">{{ trends().length }}</span>
            </button>
            <button
              type="button"
              (click)="activeTab = 'trial-balance'"
              class="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors border-0 cursor-pointer inline-flex items-center gap-1.5"
              [ngClass]="activeTab === 'trial-balance' ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200'"
            >
              <span nz-icon nzType="account-book"></span> Trial Balance
              <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">{{ trialBalanceRows().length }}</span>
            </button>
          </div>

          <!-- Contextual Controls for Active Tab -->
          <div class="flex items-center gap-2">
            @if (activeTab === 'cashbook') {
              <!-- Account Filter -->
              <nz-select
                class="w-48 text-xs"
                [(ngModel)]="selectedAccountNo"
                (ngModelChange)="loadCashbook()"
                nzPlaceHolder="All Cash & Bank Accounts"
              >
                <nz-option [nzValue]="0" nzLabel="All Accounts"></nz-option>
                @for (acc of accounts(); track acc.account_no) {
                  <nz-option [nzValue]="acc.account_no" [nzLabel]="acc.account_name"></nz-option>
                }
              </nz-select>

              <!-- Text Search -->
              <nz-input-group [nzPrefix]="searchIcon" class="w-60 rounded-md">
                <input
                  type="text"
                  nz-input
                  placeholder="Doc #, particulars, type..."
                  [(ngModel)]="searchQuery"
                  class="text-xs"
                />
              </nz-input-group>
              <ng-template #searchIcon>
                <span nz-icon nzType="search" class="text-slate-400"></span>
              </ng-template>
            }
          </div>
        </div>

        <!-- Tab 1: Cashbook Ledger -->
        @if (activeTab === 'cashbook') {
          <div class="flex-1 min-h-0 flex flex-col overflow-hidden">
            <nz-spin [nzSpinning]="isLoadingCashbook()" class="flex-1 min-h-0 flex flex-col">
              @if (filteredCashbookEntries().length > 0) {
                <div class="flex-1 min-h-0 overflow-auto w-full max-w-full">
                  <table class="w-full text-left border-collapse text-xs print-table min-w-[850px]">
                    <thead class="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                      <tr>
                        <th class="p-2.5 w-12 text-center">#</th>
                        <th class="p-2.5 w-28">Date & Time</th>
                        <th class="p-2.5 w-32">Type</th>
                        <th class="p-2.5 w-32">Doc / Voucher #</th>
                        <th class="p-2.5">Particulars / Narration</th>
                        <th class="p-2.5 w-36">Account</th>
                        <th class="p-2.5 text-right w-28 text-emerald-700">Cash In (৳)</th>
                        <th class="p-2.5 text-right w-28 text-rose-700">Cash Out (৳)</th>
                        <th class="p-2.5 text-right w-32 text-slate-900">Balance (৳)</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      @for (item of filteredCashbookEntries(); track $index; let idx = $index) {
                        <tr class="hover:bg-slate-50/75 transition-colors">
                          <td class="p-2.5 text-center text-slate-400 font-mono">{{ idx + 1 }}</td>
                          <td class="p-2.5 text-slate-600 font-mono">
                            {{ item.entry_date | date: 'dd MMM, HH:mm' }}
                          </td>
                          <td class="p-2.5">
                            <span
                              class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
                              [ngClass]="getDocTypeBadgeClass(item.doc_type)"
                            >
                              {{ item.doc_type }}
                            </span>
                          </td>
                          <td class="p-2.5 font-mono font-medium text-slate-800">
                            {{ item.doc_no || '—' }}
                          </td>
                          <td class="p-2.5 text-slate-700 max-w-md truncate" [title]="item.description || ''">
                            {{ item.description || 'General transaction' }}
                          </td>
                          <td class="p-2.5 text-slate-600 truncate" [title]="item.account_name || ''">
                            {{ item.account_name || 'Cash Drawer' }}
                          </td>
                          <td class="p-2.5 text-right font-mono font-semibold text-emerald-700">
                            {{ item.cash_in > 0 ? (item.cash_in | number: '1.2-2') : '—' }}
                          </td>
                          <td class="p-2.5 text-right font-mono font-semibold text-rose-700">
                            {{ item.cash_out > 0 ? (item.cash_out | number: '1.2-2') : '—' }}
                          </td>
                          <td class="p-2.5 text-right font-mono font-bold text-slate-900">
                            ৳ {{ item.balance | number: '1.2-2' }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                <!-- Sticky Table Footer -->
                <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-600 font-medium">
                  <div class="flex items-center gap-3">
                    <span>Records: <strong class="text-slate-900 font-mono">{{ filteredCashbookEntries().length }}</strong></span>
                    <span class="text-slate-300">|</span>
                    <span>Date Range: <strong class="text-slate-900 font-mono">{{ fromDateFormatted }} to {{ toDateFormatted }}</strong></span>
                  </div>
                  <div class="flex items-center gap-4 font-mono">
                    <span class="text-emerald-700">Total In: <strong class="font-bold">৳ {{ filteredTotalCashIn | number: '1.2-2' }}</strong></span>
                    <span class="text-slate-300">|</span>
                    <span class="text-rose-700">Total Out: <strong class="font-bold">৳ {{ filteredTotalCashOut | number: '1.2-2' }}</strong></span>
                    <span class="text-slate-300">|</span>
                    <span class="text-slate-900">Net Flow: <strong class="font-bold">৳ {{ filteredTotalCashIn - filteredTotalCashOut | number: '1.2-2' }}</strong></span>
                  </div>
                </div>
              } @else {
                <div class="flex-1 min-h-0 flex items-center justify-center p-8">
                  <app-empty-state
                    title="No cashbook entries recorded"
                    description="No cash movements found for the selected date range or filter criteria."
                  >
                  </app-empty-state>
                </div>
              }
            </nz-spin>
          </div>
        }

        <!-- Tab 2: Buy vs Sale Reconciliation -->
        @if (activeTab === 'reconciliation') {
          <div class="flex-1 min-h-0 flex flex-col overflow-hidden">
            <nz-spin [nzSpinning]="isLoadingTrends()" class="flex-1 min-h-0 flex flex-col">
              @if (trends().length > 0) {
                <div class="flex-1 min-h-0 overflow-auto w-full max-w-full">
                  <table class="w-full text-left border-collapse text-xs print-table min-w-[850px]">
                    <thead class="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                      <tr>
                        <th class="p-2.5 w-12 text-center">#</th>
                        <th class="p-2.5 w-32">Date</th>
                        <th class="p-2.5 text-right w-36 text-sky-800">Total Sale (৳)</th>
                        <th class="p-2.5 text-right w-36 text-slate-800">Buy / COGS (৳)</th>
                        <th class="p-2.5 text-right w-36 text-emerald-800">Gross Profit (৳)</th>
                        <th class="p-2.5 text-right w-36 text-rose-800">Operating Cost (৳)</th>
                        <th class="p-2.5 text-right w-36 text-indigo-900">Net Profit (৳)</th>
                        <th class="p-2.5 text-right w-24">Margin %</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      @for (t of trends(); track t.date_val; let idx = $index) {
                        <tr class="hover:bg-slate-50/75 transition-colors">
                          <td class="p-2.5 text-center text-slate-400 font-mono">{{ idx + 1 }}</td>
                          <td class="p-2.5 font-medium text-slate-800 font-mono">
                            {{ t.date_label }} ({{ t.date_val | date: 'dd-MM-yyyy' }})
                          </td>
                          <td class="p-2.5 text-right font-mono font-semibold text-sky-800">
                            ৳ {{ t.total_sale | number: '1.2-2' }}
                          </td>
                          <td class="p-2.5 text-right font-mono font-medium text-slate-700">
                            ৳ {{ t.buy_price | number: '1.2-2' }}
                          </td>
                          <td class="p-2.5 text-right font-mono font-semibold text-emerald-700">
                            ৳ {{ t.gross_profit | number: '1.2-2' }}
                          </td>
                          <td class="p-2.5 text-right font-mono font-medium text-rose-700">
                            ৳ {{ t.op_cost | number: '1.2-2' }}
                          </td>
                          <td class="p-2.5 text-right font-mono font-bold" [ngClass]="t.net_profit >= 0 ? 'text-indigo-900' : 'text-rose-700'">
                            ৳ {{ t.net_profit | number: '1.2-2' }}
                          </td>
                          <td class="p-2.5 text-right font-mono">
                            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {{ t.total_sale > 0 ? ((t.gross_profit / t.total_sale) * 100 | number: '1.1-1') : '0.0' }}%
                            </span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                <!-- Footer with Grand Totals -->
                <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-600 font-medium">
                  <div class="flex items-center gap-3">
                    <span>Days Reconciled: <strong class="text-slate-900 font-mono">{{ trends().length }}</strong></span>
                  </div>
                  <div class="flex items-center gap-4 font-mono">
                    <span class="text-sky-800">Sales: <strong>৳ {{ trendTotalSales | number: '1.2-2' }}</strong></span>
                    <span class="text-slate-300">|</span>
                    <span class="text-slate-800">Buy: <strong>৳ {{ trendTotalBuy | number: '1.2-2' }}</strong></span>
                    <span class="text-slate-300">|</span>
                    <span class="text-emerald-800">Gross: <strong>৳ {{ trendTotalGross | number: '1.2-2' }}</strong></span>
                    <span class="text-slate-300">|</span>
                    <span class="text-rose-800">Exp: <strong>৳ {{ trendTotalExpenses | number: '1.2-2' }}</strong></span>
                    <span class="text-slate-300">|</span>
                    <span class="text-indigo-900">Net Profit: <strong class="text-sm">৳ {{ trendTotalNet | number: '1.2-2' }}</strong></span>
                  </div>
                </div>
              } @else {
                <div class="flex-1 min-h-0 flex items-center justify-center p-8">
                  <app-empty-state
                    title="No reconciliation data found"
                    description="No daily buy/sale trends recorded in this date range."
                  >
                  </app-empty-state>
                </div>
              }
            </nz-spin>
          </div>
        }

        <!-- Tab 3: Trial Balance -->
        @if (activeTab === 'trial-balance') {
          <div class="flex-1 min-h-0 flex flex-col overflow-hidden">
            <nz-spin [nzSpinning]="isLoadingTrialBalance()" class="flex-1 min-h-0 flex flex-col">
              @if (trialBalanceRows().length > 0) {
                <div class="flex-1 min-h-0 overflow-auto w-full max-w-full">
                  <table class="w-full text-left border-collapse text-xs print-table min-w-[850px]">
                    <thead class="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                      <tr>
                        <th class="p-2.5 w-12 text-center">#</th>
                        <th class="p-2.5 w-28">Code</th>
                        <th class="p-2.5">Account Name</th>
                        <th class="p-2.5 w-32">Classification</th>
                        <th class="p-2.5 text-right w-36 text-slate-800">Total Debit (৳)</th>
                        <th class="p-2.5 text-right w-36 text-slate-800">Total Credit (৳)</th>
                        <th class="p-2.5 text-right w-36 text-sky-800">Net Balance (৳)</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      @for (row of trialBalanceRows(); track row.account_no; let idx = $index) {
                        <tr class="hover:bg-slate-50/75 transition-colors">
                          <td class="p-2.5 text-center text-slate-400 font-mono">{{ idx + 1 }}</td>
                          <td class="p-2.5 font-mono font-medium text-slate-700">{{ row.account_code || '—' }}</td>
                          <td class="p-2.5 font-medium text-slate-900">{{ row.account_name }}</td>
                          <td class="p-2.5">
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {{ getCategoryLabel(row.account_category) }}
                            </span>
                          </td>
                          <td class="p-2.5 text-right font-mono font-medium text-slate-800">
                            {{ row.total_debit > 0 ? (row.total_debit | number: '1.2-2') : '—' }}
                          </td>
                          <td class="p-2.5 text-right font-mono font-medium text-slate-800">
                            {{ row.total_credit > 0 ? (row.total_credit | number: '1.2-2') : '—' }}
                          </td>
                          <td class="p-2.5 text-right font-mono font-bold" [ngClass]="row.net_balance >= 0 ? 'text-sky-800' : 'text-rose-700'">
                            ৳ {{ row.net_balance | number: '1.2-2' }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                <!-- Footer with Trial Balance Verification -->
                <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-600 font-medium">
                  <div class="flex items-center gap-3">
                    <span>Accounts: <strong class="text-slate-900 font-mono">{{ trialBalanceRows().length }}</strong></span>
                    <span class="text-slate-300">|</span>
                    <span
                      class="inline-flex items-center gap-1 font-semibold"
                      [ngClass]="Math.abs(trialBalanceTotalDebit - trialBalanceTotalCredit) < 0.01 ? 'text-emerald-700' : 'text-amber-700'"
                    >
                      <span nz-icon [nzType]="Math.abs(trialBalanceTotalDebit - trialBalanceTotalCredit) < 0.01 ? 'check-circle' : 'exclamation-circle'"></span>
                      {{ Math.abs(trialBalanceTotalDebit - trialBalanceTotalCredit) < 0.01 ? 'Balanced Ledger (Debit = Credit)' : 'Trial Balance Variance Detected' }}
                    </span>
                  </div>
                  <div class="flex items-center gap-4 font-mono">
                    <span>Total Debit: <strong class="text-slate-900 font-bold">৳ {{ trialBalanceTotalDebit | number: '1.2-2' }}</strong></span>
                    <span class="text-slate-300">|</span>
                    <span>Total Credit: <strong class="text-slate-900 font-bold">৳ {{ trialBalanceTotalCredit | number: '1.2-2' }}</strong></span>
                  </div>
                </div>
              } @else {
                <div class="flex-1 min-h-0 flex items-center justify-center p-8">
                  <app-empty-state
                    title="No accounts ledger data"
                    description="No trial balance entries found for this period."
                  >
                  </app-empty-state>
                </div>
              }
            </nz-spin>
          </div>
        }
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
export class CashbookReportComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly accountingService = inject(AccountingService);
  private readonly msg = inject(NzMessageService);

  readonly Math = Math;

  // Active tab state
  activeTab: 'cashbook' | 'reconciliation' | 'trial-balance' = 'cashbook';

  // Date filter state
  activePreset: DatePreset = 'today';
  fromDate: Date | null = new Date();
  toDate: Date | null = new Date();

  get fromDateFormatted(): string {
    return formatDateToDdMmYyyy(this.fromDate);
  }

  get toDateFormatted(): string {
    return formatDateToDdMmYyyy(this.toDate);
  }

  // Secondary filters
  searchQuery = '';
  selectedAccountNo = 0;

  // Data signals
  summary = signal<FinancialReportSummary | null>(null);
  cashbookEntries = signal<CashbookEntry[]>([]);
  trends = signal<DailySalesTrend[]>([]);
  trialBalanceRows = signal<TrialBalanceRow[]>([]);
  accounts = signal<AccTransactionAccount[]>([]);

  // Loading states
  isLoadingSummary = signal(false);
  isLoadingCashbook = signal(false);
  isLoadingTrends = signal(false);
  isLoadingTrialBalance = signal(false);

  // Filtered cashbook entries
  filteredCashbookEntries = computed(() => {
    let list = this.cashbookEntries();
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        item =>
          (item.doc_no && item.doc_no.toLowerCase().includes(q)) ||
          (item.doc_type && item.doc_type.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.account_name && item.account_name.toLowerCase().includes(q))
      );
    }
    return list;
  });

  // Computed totals
  get totalCashIn(): number {
    return this.cashbookEntries().reduce((sum, e) => sum + (e.cash_in || 0), 0);
  }

  get totalCashOut(): number {
    return this.cashbookEntries().reduce((sum, e) => sum + (e.cash_out || 0), 0);
  }

  get netCashFlow(): number {
    return this.totalCashIn - this.totalCashOut;
  }

  get filteredTotalCashIn(): number {
    return this.filteredCashbookEntries().reduce((sum, e) => sum + (e.cash_in || 0), 0);
  }

  get filteredTotalCashOut(): number {
    return this.filteredCashbookEntries().reduce((sum, e) => sum + (e.cash_out || 0), 0);
  }

  get grossMarginPct(): string {
    const s = this.summary();
    if (!s || !s.total_sales || s.total_sales <= 0) return '0.0';
    return ((s.total_profit / s.total_sales) * 100).toFixed(1);
  }

  get trendTotalSales(): number {
    return this.trends().reduce((acc, t) => acc + (t.total_sale || 0), 0);
  }

  get trendTotalBuy(): number {
    return this.trends().reduce((acc, t) => acc + (t.buy_price || 0), 0);
  }

  get trendTotalGross(): number {
    return this.trends().reduce((acc, t) => acc + (t.gross_profit || 0), 0);
  }

  get trendTotalExpenses(): number {
    return this.trends().reduce((acc, t) => acc + (t.op_cost || 0), 0);
  }

  get trendTotalNet(): number {
    return this.trends().reduce((acc, t) => acc + (t.net_profit || 0), 0);
  }

  get trialBalanceTotalDebit(): number {
    return this.trialBalanceRows().reduce((acc, r) => acc + (r.total_debit || 0), 0);
  }

  get trialBalanceTotalCredit(): number {
    return this.trialBalanceRows().reduce((acc, r) => acc + (r.total_credit || 0), 0);
  }

  ngOnInit(): void {
    this.loadAccounts();
    this.applyPreset('today');
  }

  loadAccounts(): void {
    this.accountingService.getAccounts().subscribe({
      next: res => {
        if (res.data) {
          this.accounts.set(res.data);
        }
      },
    });
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

    this.reloadAllData();
  }

  onDateChange(): void {
    this.activePreset = 'custom';
    this.reloadAllData();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedAccountNo = 0;
    this.applyPreset('today');
  }

  reloadAllData(): void {
    this.loadSummary();
    this.loadCashbook();
    this.loadTrends();
    this.loadTrialBalance();
  }

  loadSummary(): void {
    this.isLoadingSummary.set(true);
    this.dashboardService.getReportSummary({ fromDate: this.fromDateFormatted, toDate: this.toDateFormatted }).subscribe({
      next: res => {
        this.isLoadingSummary.set(false);
        if (res.data) {
          this.summary.set(res.data);
        }
      },
      error: () => this.isLoadingSummary.set(false),
    });
  }

  loadCashbook(): void {
    this.isLoadingCashbook.set(true);
    const params: { fromDate: string; toDate: string; accountNo?: number } = {
      fromDate: this.fromDateFormatted,
      toDate: this.toDateFormatted,
    };
    if (this.selectedAccountNo > 0) {
      params.accountNo = this.selectedAccountNo;
    }

    this.dashboardService.getCashbook(params).subscribe({
      next: res => {
        this.isLoadingCashbook.set(false);
        this.cashbookEntries.set(res.data || []);
      },
      error: () => this.isLoadingCashbook.set(false),
    });
  }

  loadTrends(): void {
    this.isLoadingTrends.set(true);
    this.dashboardService.getTrends({ fromDate: this.fromDateFormatted, toDate: this.toDateFormatted }).subscribe({
      next: res => {
        this.isLoadingTrends.set(false);
        this.trends.set(res.data || []);
      },
      error: () => this.isLoadingTrends.set(false),
    });
  }

  loadTrialBalance(): void {
    this.isLoadingTrialBalance.set(true);
    this.accountingService.getTrialBalance({ fromDate: this.fromDateFormatted, toDate: this.toDateFormatted }).subscribe({
      next: res => {
        this.isLoadingTrialBalance.set(false);
        this.trialBalanceRows.set(res.data || []);
      },
      error: () => this.isLoadingTrialBalance.set(false),
    });
  }

  getDocTypeBadgeClass(type: string): string {
    const t = (type || '').toLowerCase();
    if (t.includes('sale') || t.includes('invoice') || t.includes('pos')) {
      return 'bg-emerald-100 text-emerald-800';
    }
    if (t.includes('due') || t.includes('collection') || t.includes('receipt')) {
      return 'bg-sky-100 text-sky-800';
    }
    if (t.includes('purchase') || t.includes('supplier')) {
      return 'bg-amber-100 text-amber-800';
    }
    if (t.includes('expense')) {
      return 'bg-rose-100 text-rose-800';
    }
    if (t.includes('transfer') || t.includes('reconciliation')) {
      return 'bg-purple-100 text-purple-800';
    }
    if (t.includes('return') || t.includes('refund')) {
      return 'bg-orange-100 text-orange-800';
    }
    return 'bg-slate-100 text-slate-700';
  }

  getCategoryLabel(category: number): string {
    switch (category) {
      case 1:
        return 'Asset';
      case 2:
        return 'Liability';
      case 3:
        return 'Equity';
      case 4:
        return 'Revenue';
      case 5:
        return 'Expense';
      default:
        return 'Ledger Account';
    }
  }

  exportCurrentReportCsv(): void {
    if (this.activeTab === 'cashbook') {
      const items = this.filteredCashbookEntries();
      if (!items.length) {
        this.msg.warning('No cashbook records to export.');
        return;
      }
      const headers = ['#', 'Date & Time', 'Doc Type', 'Voucher #', 'Narration', 'Account', 'Cash In (BDT)', 'Cash Out (BDT)', 'Balance (BDT)'];
      const rows = items.map((r, i) => [
        i + 1,
        `"${r.entry_date}"`,
        `"${r.doc_type}"`,
        `"${r.doc_no || ''}"`,
        `"${(r.description || '').replace(/"/g, '""')}"`,
        `"${r.account_name || ''}"`,
        r.cash_in.toFixed(2),
        r.cash_out.toFixed(2),
        r.balance.toFixed(2),
      ]);
      this.downloadCsv(headers, rows, `cashbook_register_${this.fromDateFormatted}_to_${this.toDateFormatted}.csv`);
    } else if (this.activeTab === 'reconciliation') {
      const items = this.trends();
      if (!items.length) {
        this.msg.warning('No reconciliation records to export.');
        return;
      }
      const headers = ['#', 'Date Label', 'Date', 'Total Sale (BDT)', 'Buy Price (BDT)', 'Gross Profit (BDT)', 'Operating Cost (BDT)', 'Net Profit (BDT)'];
      const rows = items.map((r, i) => [
        i + 1,
        `"${r.date_label}"`,
        `"${r.date_val}"`,
        r.total_sale.toFixed(2),
        r.buy_price.toFixed(2),
        r.gross_profit.toFixed(2),
        r.op_cost.toFixed(2),
        r.net_profit.toFixed(2),
      ]);
      this.downloadCsv(headers, rows, `buy_sale_reconciliation_${this.fromDateFormatted}_to_${this.toDateFormatted}.csv`);
    } else {
      const items = this.trialBalanceRows();
      if (!items.length) {
        this.msg.warning('No trial balance records to export.');
        return;
      }
      const headers = ['#', 'Account Code', 'Account Name', 'Classification', 'Total Debit (BDT)', 'Total Credit (BDT)', 'Net Balance (BDT)'];
      const rows = items.map((r, i) => [
        i + 1,
        `"${r.account_code || ''}"`,
        `"${r.account_name}"`,
        `"${this.getCategoryLabel(r.account_category)}"`,
        r.total_debit.toFixed(2),
        r.total_credit.toFixed(2),
        r.net_balance.toFixed(2),
      ]);
      this.downloadCsv(headers, rows, `trial_balance_${this.fromDateFormatted}_to_${this.toDateFormatted}.csv`);
    }
  }

  private downloadCsv(headers: string[], rows: (string | number)[][], filename: string): void {
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    this.msg.success(`Exported ${filename}`);
  }

  printReport(): void {
    window.print();
  }
}

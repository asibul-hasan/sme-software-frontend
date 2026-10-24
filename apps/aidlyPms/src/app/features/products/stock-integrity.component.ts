import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StocktakeService } from '../../core/services/stocktake.service';
import { StockIntegrityResult, StockIntegrityDiscrepancyItem } from '../../core/models/inventory.models';

@Component({
  selector: 'app-stock-integrity',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzSpinModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-4 w-full">
      <app-page-header
        title="Stock Ledger Integrity Audit"
        subtitle="Verifies that batch quantities strictly equal the sum of immutable ledger movements and validates zero-negative stock rules"
        formId="PROD_1613"
        [breadcrumbs]="[
          { label: 'Medicines & Stock', url: '/products/list' },
          { label: 'Stock Reports', url: '/products/reports' },
          { label: 'Ledger Integrity' }
        ]"
      >
        <div actions class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            nz-button
            nzType="default"
            class="rounded-md h-8 px-3 text-xs font-semibold inline-flex items-center gap-1.5"
            [nzLoading]="isLoading()"
            (click)="runAudit()"
          >
            <span nz-icon nzType="sync"></span>
            Re-run Integrity Check
          </button>
        </div>
      </app-page-header>

      <nz-spin [nzSpinning]="isLoading()" class="flex-1 min-h-0 flex flex-col w-full space-y-4">
        <!-- Integrity Status Banner -->
        @if (report()?.is_clean) {
          <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl shrink-0">
                <span nz-icon nzType="check-circle" nzTheme="fill"></span>
              </div>
              <div>
                <h3 class="text-sm font-bold text-emerald-900 m-0">Stock Ledger 100% In Sync</h3>
                <p class="text-xs text-emerald-700 mt-0.5 m-0">
                  Every batch matches the exact mathematical sum of ledger movements. No negative stock or placeholder violations detected.
                </p>
              </div>
            </div>
            <span class="text-xs font-semibold px-3 py-1 bg-emerald-200 text-emerald-900 rounded-full">
              Clean Pass
            </span>
          </div>
        } @else if (report()) {
          <div class="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xl shrink-0">
                <span nz-icon nzType="warning" nzTheme="fill"></span>
              </div>
              <div>
                <h3 class="text-sm font-bold text-rose-900 m-0">
                  Discrepancies Detected: {{ report()?.total_discrepancies }} Inconsistency Issues
                </h3>
                <p class="text-xs text-rose-700 mt-0.5 m-0">
                  Stock integrity checks identified batches with mismatched ledger sums, negative balances, or orphaned movement histories.
                </p>
              </div>
            </div>
            <span class="text-xs font-semibold px-3 py-1 bg-rose-200 text-rose-900 rounded-full">
              Attention Required
            </span>
          </div>
        }

        <!-- 4 Metric Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="pms-card p-4 flex flex-col justify-between">
            <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">Ledger vs Batch Mismatches</span>
            <div class="flex items-end justify-between mt-2">
              <h2 class="text-2xl font-bold m-0 font-mono" [ngClass]="(report()?.mismatched_batch_count ?? 0) > 0 ? 'text-rose-600' : 'text-slate-800'">
                {{ report()?.mismatched_batch_count ?? 0 }}
              </h2>
              <span class="text-xs text-slate-400">batches</span>
            </div>
          </div>

          <div class="pms-card p-4 flex flex-col justify-between">
            <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">Negative Stock Batches</span>
            <div class="flex items-end justify-between mt-2">
              <h2 class="text-2xl font-bold m-0 font-mono" [ngClass]="(report()?.negative_batch_count ?? 0) > 0 ? 'text-rose-600' : 'text-slate-800'">
                {{ report()?.negative_batch_count ?? 0 }}
              </h2>
              <span class="text-xs text-slate-400">non-placeholder</span>
            </div>
          </div>

          <div class="pms-card p-4 flex flex-col justify-between">
            <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">Positive Placeholder Batches</span>
            <div class="flex items-end justify-between mt-2">
              <h2 class="text-2xl font-bold m-0 font-mono" [ngClass]="(report()?.positive_placeholder_count ?? 0) > 0 ? 'text-rose-600' : 'text-slate-800'">
                {{ report()?.positive_placeholder_count ?? 0 }}
              </h2>
              <span class="text-xs text-slate-400">must be &le; 0</span>
            </div>
          </div>

          <div class="pms-card p-4 flex flex-col justify-between">
            <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">Orphan Batches</span>
            <div class="flex items-end justify-between mt-2">
              <h2 class="text-2xl font-bold m-0 font-mono" [ngClass]="(report()?.orphan_batch_count ?? 0) > 0 ? 'text-rose-600' : 'text-slate-800'">
                {{ report()?.orphan_batch_count ?? 0 }}
              </h2>
              <span class="text-xs text-slate-400">no ledger rows</span>
            </div>
          </div>
        </div>

        <!-- Sample Discrepancies Table -->
        <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
          <div class="p-3 border-b border-slate-100 flex items-center justify-between">
            <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider m-0">
              Discrepancy Detail Records (First {{ report()?.sample_discrepancies?.length || 0 }} Items)
            </h4>
            <span class="text-xs text-slate-500">Live PostgreSQL Catalog Audit</span>
          </div>

          <div class="flex-1 min-h-0 overflow-auto w-full">
            <table class="w-full text-sm text-left border-collapse min-w-[850px]">
              <thead class="sticky top-0 z-10 bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200 shadow-xs">
                <tr>
                  <th class="p-3">Batch ID / Product</th>
                  <th class="p-3">Batch Number</th>
                  <th class="p-3 text-right">Physical Batch Qty</th>
                  <th class="p-3 text-right">Ledger Sum Qty</th>
                  <th class="p-3 text-right">Variance</th>
                  <th class="p-3 text-center">Issue Category</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-800">
                @for (d of report()?.sample_discrepancies; track d.batch_no) {
                  <tr class="hover:bg-slate-50/70 transition-colors">
                    <td class="p-3">
                      <div class="font-semibold text-slate-900">{{ d.product_name }}</div>
                      <div class="text-[11px] text-slate-400 font-mono">Batch ID #{{ d.batch_no }} · Prod #{{ d.product_no }}</div>
                    </td>
                    <td class="p-3 font-mono text-xs text-slate-700">
                      {{ d.batch_number }}
                      @if (d.is_placeholder) {
                        <span class="ml-1 text-[10px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded">Placeholder</span>
                      }
                    </td>
                    <td class="p-3 text-right font-mono font-semibold text-slate-800">
                      {{ d.batch_quantity }}
                    </td>
                    <td class="p-3 text-right font-mono font-semibold text-slate-800">
                      {{ d.ledger_sum_quantity }}
                    </td>
                    <td class="p-3 text-right font-mono font-bold text-rose-600">
                      {{ d.variance > 0 ? '+' + d.variance : d.variance }}
                    </td>
                    <td class="p-3 text-center">
                      <span
                        class="px-2 py-0.5 rounded-full text-xs font-medium inline-block"
                        [ngClass]="getIssueTagClass(d.issue_type)"
                      >
                        {{ formatIssueType(d.issue_type) }}
                      </span>
                    </td>
                  </tr>
                } @empty {
                  @if (!isLoading()) {
                    <tr>
                      <td colspan="6" class="p-8 text-center text-slate-500">
                        <div class="flex flex-col items-center justify-center gap-2">
                          <span nz-icon nzType="check-circle" class="text-3xl text-emerald-500"></span>
                          <span class="font-medium text-slate-700">Zero discrepancies detected.</span>
                          <span class="text-xs text-slate-400">All batch balances agree perfectly with the universal inventory movements ledger.</span>
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      </nz-spin>
    </div>
  `,
})
export class StockIntegrityComponent implements OnInit {
  private readonly stocktakeService = inject(StocktakeService);
  private readonly messageService = inject(NzMessageService);

  report = signal<StockIntegrityResult | null>(null);
  isLoading = signal(false);

  ngOnInit(): void {
    this.runAudit();
  }

  runAudit(): void {
    this.isLoading.set(true);
    this.stocktakeService.getIntegrityReport().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.report.set(res.data);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.messageService.error('Failed to run stock ledger integrity check.');
      },
    });
  }

  formatIssueType(type: string): string {
    switch (type) {
      case 'BATCH_MISMATCH':
        return 'Movement Sum Mismatch';
      case 'NEGATIVE_STOCK':
        return 'Negative Physical Stock';
      case 'POSITIVE_PLACEHOLDER':
        return 'Positive Placeholder Qty';
      case 'ORPHAN_BATCH':
        return 'No Ledger Records';
      default:
        return type;
    }
  }

  getIssueTagClass(type: string): string {
    switch (type) {
      case 'BATCH_MISMATCH':
        return 'bg-amber-50 text-amber-800 border border-amber-200';
      case 'NEGATIVE_STOCK':
        return 'bg-rose-50 text-rose-800 border border-rose-200';
      case 'POSITIVE_PLACEHOLDER':
        return 'bg-purple-50 text-purple-800 border border-purple-200';
      case 'ORPHAN_BATCH':
        return 'bg-slate-100 text-slate-700 border border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
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
import { NzModalModule } from 'ng-zorro-antd/modal';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ReportService, AuditLogItem } from '../../core/services/report.service';

@Component({
  selector: 'app-audit-logs',
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
    NzModalModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Security & System Audit Logs"
        subtitle="Immutable ledger of operational mutations, deletions, and access changes across all modules"
        formId="CFG_2006"
        [breadcrumbs]="[
          { label: 'Settings', url: '/settings/sale-config' },
          { label: 'Audit Logs' }
        ]"
      >
        <div actions class="flex items-center gap-2">
          <button nz-button nzType="primary" (click)="loadLogs()">
            <i nz-icon nzType="reload"></i> Refresh Logs
          </button>
        </div>
      </app-page-header>

      <div class="flex-1 bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden flex flex-col p-3">
        <!-- Filter Toolbar -->
        <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div class="flex items-center gap-3 flex-wrap">
            <div class="w-64">
              <input
                type="text"
                nz-input
                placeholder="Search table, action, or user..."
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchChange()"
              />
            </div>

            <div class="w-48">
              <nz-select
                [(ngModel)]="selectedTable"
                (ngModelChange)="loadLogs()"
                nzPlaceHolder="Filter by Table"
                class="w-full"
                nzAllowClear
              >
                <nz-option nzValue="prod_products" nzLabel="Products (prod_products)"></nz-option>
                <nz-option nzValue="cust_customers" nzLabel="Customers (cust_customers)"></nz-option>
                <nz-option nzValue="supp_suppliers" nzLabel="Suppliers (supp_suppliers)"></nz-option>
                <nz-option nzValue="prod_companies" nzLabel="Companies (prod_companies)"></nz-option>
                <nz-option nzValue="prod_generics" nzLabel="Generics (prod_generics)"></nz-option>
                <nz-option nzValue="sale_invoices" nzLabel="Sales (sale_invoices)"></nz-option>
                <nz-option nzValue="sale_returns" nzLabel="Returns (sale_returns)"></nz-option>
                <nz-option nzValue="pur_purchase_invoices" nzLabel="Purchases (pur_purchase_invoices)"></nz-option>
                <nz-option nzValue="acc_expenses" nzLabel="Expenses (acc_expenses)"></nz-option>
              </nz-select>
            </div>

            <div class="w-36">
              <nz-select
                [(ngModel)]="selectedAction"
                (ngModelChange)="loadLogs()"
                nzPlaceHolder="Action"
                class="w-full"
                nzAllowClear
              >
                <nz-option nzValue="CREATE" nzLabel="CREATE"></nz-option>
                <nz-option nzValue="UPDATE" nzLabel="UPDATE"></nz-option>
                <nz-option nzValue="DELETE" nzLabel="DELETE"></nz-option>
              </nz-select>
            </div>
          </div>

          <div class="text-xs text-slate-500">
            Total Records: <strong class="text-slate-800">{{ totalRecords() }}</strong>
          </div>
        </div>

        <!-- Audit Records Table -->
        <div class="flex-1 overflow-auto pt-2 w-full max-w-full">
          <table class="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead>
              <tr class="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                <th class="p-2 w-16">#</th>
                <th class="p-2">Timestamp</th>
                <th class="p-2 text-center w-24">Action</th>
                <th class="p-2">Entity Table</th>
                <th class="p-2">Record ID</th>
                <th class="p-2">User</th>
                <th class="p-2">IP Address</th>
                <th class="p-2 text-center w-20">Payload</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let log of logs()" class="hover:bg-slate-50">
                <td class="p-2 text-slate-400 font-mono">{{ log.audit_no }}</td>
                <td class="p-2 text-slate-600 font-mono">{{ log.created_at | date:'dd MMM yyyy, hh:mm:ss a' }}</td>
                <td class="p-2 text-center">
                  <nz-tag *ngIf="log.action === 'CREATE'" nzColor="success" class="font-bold">CREATE</nz-tag>
                  <nz-tag *ngIf="log.action === 'UPDATE'" nzColor="processing" class="font-bold">UPDATE</nz-tag>
                  <nz-tag *ngIf="log.action === 'DELETE'" nzColor="error" class="font-bold">DELETE</nz-tag>
                </td>
                <td class="p-2 font-mono font-medium text-slate-800">{{ log.table_name }}</td>
                <td class="p-2 font-mono text-slate-600">{{ log.record_id || '-' }}</td>
                <td class="p-2 text-slate-700">
                  <span class="inline-flex items-center gap-1">
                    <i nz-icon nzType="user" class="text-slate-400"></i>
                    {{ log.user_name || 'System / User #' + (log.user_no || 0) }}
                  </span>
                </td>
                <td class="p-2 text-slate-500 font-mono text-[11px]">{{ log.ip_address || '127.0.0.1' }}</td>
                <td class="p-2 text-center">
                  <button
                    nz-button
                    nzSize="small"
                    nzType="default"
                    (click)="viewPayload(log)"
                    class="text-xs"
                  >
                    View
                  </button>
                </td>
              </tr>

              <tr *ngIf="logs().length === 0 && !isLoading()">
                <td colspan="8" class="p-8 text-center text-slate-400">
                  No audit log entries found matching current filter criteria.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div class="flex items-center justify-between pt-3 border-t border-slate-200 text-xs text-slate-600">
          <div>
            Showing page {{ pageIndex }} ({{ logs().length }} items)
          </div>
          <div class="flex items-center gap-2">
            <button
              nz-button
              nzSize="small"
              [disabled]="pageIndex <= 1"
              (click)="goToPage(pageIndex - 1)"
            >
              Previous
            </button>
            <span class="font-bold">{{ pageIndex }}</span>
            <button
              nz-button
              nzSize="small"
              [disabled]="logs().length < pageSize"
              (click)="goToPage(pageIndex + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Payload Details Modal -->
    <nz-modal
      [(nzVisible)]="isModalVisible"
      [nzTitle]="'Audit Event #' + selectedLog()?.audit_no + ' (' + selectedLog()?.action + ' on ' + selectedLog()?.table_name + ')'"
      (nzOnCancel)="isModalVisible = false"
      [nzFooter]="null"
      nzWidth="650px"
    >
      <ng-container *nzModalContent>
        <div *ngIf="selectedLog()" class="space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded border border-slate-200">
            <div>
              <span class="text-slate-500 block text-[11px]">Timestamp:</span>
              <span class="font-mono font-medium text-slate-800">{{ selectedLog()?.created_at | date:'dd MMM yyyy, hh:mm:ss a' }}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[11px]">User:</span>
              <span class="font-medium text-slate-800">{{ selectedLog()?.user_name || 'System' }}</span>
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Payload / State Changes</label>
            <pre class="bg-slate-900 text-emerald-400 p-3 rounded text-[11px] font-mono max-h-80 overflow-auto whitespace-pre-wrap">{{ formatPayload(selectedLog()?.new_data || selectedLog()?.old_data) }}</pre>
          </div>
        </div>
      </ng-container>
    </nz-modal>
  `,
})
export class AuditLogsComponent implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly msg = inject(NzMessageService);

  logs = signal<AuditLogItem[]>([]);
  totalRecords = signal(0);
  isLoading = signal(false);

  pageIndex = 1;
  pageSize = 50;
  searchQuery = '';
  selectedTable: string | null = null;
  selectedAction: string | null = null;

  isModalVisible = false;
  selectedLog = signal<AuditLogItem | null>(null);

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.isLoading.set(true);
    const params: Record<string, unknown> = {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
    };

    if (this.searchQuery.trim()) params['search'] = this.searchQuery.trim();
    if (this.selectedTable) params['tableName'] = this.selectedTable;
    if (this.selectedAction) params['action'] = this.selectedAction;

    this.reportService.getAuditLogs(params).subscribe({
      next: res => {
        this.isLoading.set(false);
        this.logs.set([...(res.data?.items || [])]);
        this.totalRecords.set(res.data?.total || 0);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onSearchChange(): void {
    this.pageIndex = 1;
    this.loadLogs();
  }

  goToPage(page: number): void {
    this.pageIndex = page;
    this.loadLogs();
  }

  viewPayload(log: AuditLogItem): void {
    this.selectedLog.set(log);
    this.isModalVisible = true;
  }

  formatPayload(raw: string | undefined): string {
    if (!raw) return 'No payload captured.';
    try {
      const parsed = JSON.parse(raw);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return raw;
    }
  }
}

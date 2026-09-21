import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalService } from '../../core/services/modal.service';

interface RequisitionRecord {
  id: string;
  date: string;
  total: number;
  reqCode: string;
  supplier: string;
  itemsCount: number;
  createdBy: string;
  status: 'Approved' | 'Pending' | 'Cancelled';
}

@Component({
  selector: 'app-requisition-record',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzModalModule,
    NzIconModule,
    NzDatePickerModule,
    NzTooltipModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Requisition History & Records"
        subtitle="Audit archived and active purchase requisitions"
        formId="PROD_1606"
        [breadcrumbs]="[{ label: 'Products', url: '/products/list' }, { label: 'Requisition Records' }]"
      >
        <div filters class="flex items-center gap-2 shrink-0 flex-nowrap">
          <nz-date-picker class="w-32 shrink-0" [(ngModel)]="fromDate" nzPlaceHolder="From Date" nzFormat="dd-MM-yyyy"></nz-date-picker>
          <nz-date-picker class="w-32 shrink-0" [(ngModel)]="toDate" nzPlaceHolder="To Date" nzFormat="dd-MM-yyyy"></nz-date-picker>
          <nz-select class="w-36 shrink-0" [(ngModel)]="selectedSupplier" nzPlaceHolder="Supplier">
            <nz-option nzValue="" nzLabel="All Suppliers"></nz-option>
            <nz-option nzValue="Beximco Dist." nzLabel="Beximco Dist."></nz-option>
            <nz-option nzValue="ACI Dist." nzLabel="ACI Dist."></nz-option>
            <nz-option nzValue="Square Dist." nzLabel="Square Dist."></nz-option>
          </nz-select>
          <input
            type="text"
            nz-input
            placeholder="Created by..."
            [(ngModel)]="createdBy"
            class="w-32 shrink-0 rounded-md"
          />
          <input
            type="text"
            nz-input
            placeholder="Requisition Code..."
            [(ngModel)]="searchCode"
            class="w-40 shrink-0 rounded-md"
          />
          <button nz-button nzType="default" class="rounded-md h-7 px-2.5 text-xs shrink-0" (click)="resetFilters()">
            <span nz-icon nzType="clear"></span> Reset
          </button>
        </div>
        <div actions class="flex items-center gap-2 shrink-0 flex-nowrap">
          <button nz-button nzType="default" class="rounded-md" (click)="exportReport()">
            <span nz-icon nzType="download"></span> Export Register
          </button>
        </div>
      </app-page-header>

      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <!-- Table Scroll Container -->
        <div class="flex-1 min-h-0 overflow-auto">
          <table class="w-full text-sm text-left border-collapse">
            <thead class="sticky top-0 z-10 bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200 shadow-xs">
              <tr>
                <th class="p-3">Date</th>
                <th class="p-3 text-right">Total Bill</th>
                <th class="p-3">Requisition Info</th>
                <th class="p-3 text-center">Status</th>
                <th class="p-3 text-center w-36">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              @for (r of filteredRecords(); track r.id) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="p-3 font-mono text-xs text-slate-600">{{ r.date }}</td>
                  <td class="p-3 text-right font-mono text-xs font-bold theme-total-text">
                    ৳ {{ r.total | number: '1.2-2' }}
                  </td>
                  <td class="p-3">
                    <p class="font-bold text-slate-900 m-0 text-xs">{{ r.reqCode }}</p>
                    <p class="text-slate-400 m-0 text-[11px]">{{ r.supplier }} · {{ r.itemsCount }} items · By {{ r.createdBy }}</p>
                  </td>
                  <td class="p-3 text-center">
                    <span
                      class="px-2 py-0.5 rounded text-[11px] font-semibold"
                      [ngClass]="{
                        'bg-emerald-50 text-emerald-700 border border-emerald-200': r.status === 'Approved',
                        'bg-amber-50 text-amber-700 border border-amber-200': r.status === 'Pending',
                        'bg-rose-50 text-rose-700 border border-rose-200': r.status === 'Cancelled'
                      }"
                    >
                      {{ r.status }}
                    </span>
                  </td>
                  <td class="p-3 text-center">
                    <div class="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        (click)="viewDetails(r)"
                        nz-tooltip
                        nzTooltipTitle="View Requisition Details"
                        class="btn-tbl-action btn-tbl-view"
                      >
                        <span nz-icon nzType="eye"></span>
                      </button>
                      <button
                        type="button"
                        (click)="printRequisition(r)"
                        nz-tooltip
                        nzTooltipTitle="Print Requisition"
                        class="btn-tbl-action btn-tbl-neutral"
                      >
                        <span nz-icon nzType="printer"></span>
                      </button>
                      <button
                        type="button"
                        (click)="cancelRecord(r)"
                        nz-tooltip
                        nzTooltipTitle="Cancel Requisition"
                        class="btn-tbl-action btn-tbl-delete"
                        [disabled]="r.status === 'Cancelled'"
                      >
                        <span nz-icon nzType="delete"></span>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="p-8 text-center text-slate-400 text-xs">
                    No requisition history records match the selected filters.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Sticky Bottom Footer -->
        <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div class="flex items-center gap-3">
            <span>Requisition Records: <strong class="text-slate-900 font-semibold font-mono">{{ filteredRecords().length }}</strong></span>
            <span class="text-slate-300">|</span>
            <span class="font-semibold text-slate-700">Total Purchase Value: <strong class="theme-total-text font-mono text-sm">৳ {{ totalBill() | number: '1.2-2' }}</strong></span>
          </div>
          <button nz-button nzType="default" nzSize="small" class="rounded" (click)="exportReport()">
            <span nz-icon nzType="download"></span> Export Register
          </button>
        </div>
      </div>
    </div>

    <!-- Requisition Details Modal -->
    <nz-modal
      [(nzVisible)]="isDetailsVisible"
      [nzTitle]="'Requisition Details: ' + activeRecord?.reqCode"
      (nzOnCancel)="isDetailsVisible = false"
      (nzOnOk)="isDetailsVisible = false"
      nzOkText="Close"
    >
      <ng-container *nzModalContent>
        @if (activeRecord) {
          <div class="space-y-3 py-1 text-xs">
            <div class="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg">
              <div>
                <span class="text-slate-400">Supplier:</span>
                <p class="font-bold text-slate-800 m-0">{{ activeRecord.supplier }}</p>
              </div>
              <div>
                <span class="text-slate-400">Order Date:</span>
                <p class="font-bold text-slate-800 m-0">{{ activeRecord.date }}</p>
              </div>
              <div>
                <span class="text-slate-400">Total Bill:</span>
                <p class="font-bold theme-total-text m-0">৳ {{ activeRecord.total | number: '1.2-2' }}</p>
              </div>
              <div>
                <span class="text-slate-400">Items Quantity:</span>
                <p class="font-bold text-slate-800 m-0">{{ activeRecord.itemsCount }} line items</p>
              </div>
            </div>
            <p class="text-slate-500 m-0">
              Procurement order authorized and pending distributor delivery dispatch.
            </p>
          </div>
        }
      </ng-container>
    </nz-modal>
  `,
})
export class RequisitionRecordComponent {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);

  searchCode = '';
  selectedSupplier = '';
  fromDate: Date | null = null;
  toDate: Date | null = null;
  createdBy = '';

  records = signal<RequisitionRecord[]>([
    { id: '1', date: '15-09-2026 14:32', total: 48200, reqCode: 'REQ-2026-042', supplier: 'Beximco Dist.', itemsCount: 12, createdBy: 'Counter Staff', status: 'Approved' },
    { id: '2', date: '13-09-2026 10:15', total: 31750, reqCode: 'REQ-2026-041', supplier: 'ACI Dist.', itemsCount: 8, createdBy: 'Manager', status: 'Approved' },
    { id: '3', date: '10-09-2026 09:00', total: 62400, reqCode: 'REQ-2026-040', supplier: 'Square Dist.', itemsCount: 18, createdBy: 'Admin', status: 'Pending' },
  ]);

  filteredRecords = computed(() => {
    const q = this.searchCode.trim().toLowerCase();
    const sup = this.selectedSupplier;
    const cb = this.createdBy.trim().toLowerCase();
    return this.records().filter(r => {
      const matchCode = !q || r.reqCode.toLowerCase().includes(q);
      const matchSup = !sup || r.supplier === sup;
      const matchCb = !cb || r.createdBy.toLowerCase().includes(cb);
      return matchCode && matchSup && matchCb;
    });
  });

  totalBill = computed(() => {
    return this.filteredRecords().reduce((sum, r) => sum + r.total, 0);
  });

  isDetailsVisible = false;
  activeRecord: RequisitionRecord | null = null;

  resetFilters(): void {
    this.searchCode = '';
    this.selectedSupplier = '';
    this.fromDate = null;
    this.toDate = null;
    this.createdBy = '';
  }

  viewDetails(r: RequisitionRecord): void {
    this.activeRecord = r;
    this.isDetailsVisible = true;
  }

  printRequisition(r: RequisitionRecord): void {
    this.msg.info(`Printing purchase requisition ${r.reqCode}...`);
  }

  cancelRecord(r: RequisitionRecord): void {
    this.modal
      .confirmAction(`Cancel Requisition ${r.reqCode}?`, 'Cancelling will invalidate this procurement record.', 'Cancel Requisition', true)
      .subscribe(confirmed => {
        if (confirmed) {
          this.records.update(list =>
            list.map(rec => (rec.id === r.id ? { ...rec, status: 'Cancelled' as const } : rec))
          );
          this.msg.success(`Requisition ${r.reqCode} has been marked cancelled.`);
        }
      });
  }

  exportReport(): void {
    this.msg.success('Exporting requisition records report...');
  }
}

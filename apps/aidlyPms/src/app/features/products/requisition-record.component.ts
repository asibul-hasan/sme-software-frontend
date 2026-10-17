import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
import { NzTagModule } from 'ng-zorro-antd/tag';
import { RouterModule } from '@angular/router';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalService } from '../../core/services/modal.service';
import { ProductService } from '../../core/services/product.service';
import { SupplierService } from '../../core/services/supplier.service';
import { PrintService } from '../../core/services/print.service';
import { ProdProductRequisitionItem } from '../../core/models/product.models';

interface RequisitionRecord {
  id: string;
  date: string;
  total: number;
  reqCode: string;
  supplier: string;
  itemsCount: number;
  createdBy: string;
  status: 'Approved' | 'Pending' | 'Cancelled' | 'Fulfilled';
}

@Component({
  selector: 'app-requisition-record',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzModalModule,
    NzIconModule,
    NzDatePickerModule,
    NzTooltipModule,
    NzTagModule,
    PageHeaderComponent,
  ],
  templateUrl: './requisition-record.component.html',
})
export class RequisitionRecordComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly productService = inject(ProductService);
  private readonly supplierService = inject(SupplierService);
  private readonly printService = inject(PrintService);

  searchCode = '';
  selectedSupplier = '';
  fromDate: Date | null = null;
  toDate: Date | null = null;
  createdBy = '';

  suppliers = signal<string[]>([]);
  records = signal<RequisitionRecord[]>([]);

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
  detailItems = signal<any[]>([]);

  isPrintModalVisible = false;
  printingRecord: RequisitionRecord | null = null;

  ngOnInit(): void {
    this.loadRecords();
    this.loadSuppliers();
  }

  loadRecords(): void {
    this.productService.getRequisitions({ pageSize: 100 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const list: RequisitionRecord[] = (res.data.items || []).map((r: any) => ({
            id: String(r.requisition_no),
            date: r.requisition_date ? new Date(r.requisition_date).toISOString().slice(0, 16).replace('T', ' ') : '',
            total: r.total_cost || r.total_amount || 0,
            reqCode: r.requisition_code || r.requisition_number || `REQ-${r.requisition_no}`,
            supplier: r.supplier_name || 'General Supplier',
            itemsCount: r.total_selected_items || r.total_items || 0,
            createdBy: 'System Staff',
            status: (
              r.status === 'Fulfilled' || r.requisition_status === 4 ? 'Fulfilled' :
              r.requisition_status === 2 || r.status === 'Approved' ? 'Approved' :
              r.requisition_status === 3 || r.status === 'Cancelled' ? 'Cancelled' : 'Pending'
            ) as any,
          }));
          this.records.set(list);
        }
      },
    });
  }

  loadSuppliers(): void {
    this.supplierService.getSuppliers({ pageSize: 100 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const names = res.data.items.map(s => s.name).filter(Boolean);
          this.suppliers.set(names);
        }
      },
    });
  }

  resetFilters(): void {
    this.searchCode = '';
    this.selectedSupplier = '';
    this.fromDate = null;
    this.toDate = null;
    this.createdBy = '';
    this.loadRecords();
  }

  viewDetails(r: RequisitionRecord): void {
    this.activeRecord = r;
    this.detailItems.set([]);
    this.isDetailsVisible = true;

    this.productService.getRequisitionById(Number(r.id)).subscribe({
      next: res => {
        if (res.success && res.data && res.data.items) {
          this.detailItems.set([...res.data.items]);
        }
      },
      error: () => {
        this.msg.error('Failed to load requisition line items.');
      },
    });
  }

  printRequisition(r: RequisitionRecord): void {
    this.printingRecord = r;
    this.detailItems.set([]);
    this.isPrintModalVisible = true;
    this.productService.getRequisitionById(Number(r.id)).subscribe({
      next: res => {
        if (res.success && res.data && res.data.items) {
          this.detailItems.set([...res.data.items]);
        }
      },
      error: () => {
        this.msg.error('Failed to load requisition items for printing.');
      },
    });
  }

  triggerPrint(): void {
    if (!this.printingRecord) return;
    this.printService.printRequisitionOrder({
      reqCode: this.printingRecord.reqCode,
      date: this.printingRecord.date,
      supplier: this.printingRecord.supplier,
      createdBy: this.printingRecord.createdBy,
      status: this.printingRecord.status,
      lines: this.detailItems().map(item => ({
        name: item.product_name,
        boxQty: Number(item.box_qty) || 0,
        btp: Number(item.box_trade_price) || 0,
        totalPrice: Number(item.total_price) || 0,
      })),
      totalEstimated: this.printingRecord.total || this.detailItems().reduce((sum, item) => sum + (Number(item.total_price) || 0), 0),
    });
  }

  approveRecord(r: RequisitionRecord): void {
    if (r.status === 'Approved' || r.status === 'Fulfilled') {
      this.msg.warning(`Requisition is already ${r.status.toLowerCase()}.`);
      return;
    }
    this.modal
      .confirmAction(
        `Approve Requisition ${r.reqCode}?`,
        'Approving this requisition confirms procurement of these inventory items.',
        'Approve Requisition',
        false
      )
      .subscribe(confirmed => {
        if (confirmed) {
          this.productService.updateRequisitionStatus(Number(r.id), 'Approved').subscribe({
            next: res => {
              if (res.success) {
                this.records.update(list =>
                  list.map(rec => (rec.id === r.id ? { ...rec, status: 'Approved' as const } : rec))
                );
                if (this.activeRecord && this.activeRecord.id === r.id) {
                  this.activeRecord = { ...this.activeRecord, status: 'Approved' };
                }
                this.msg.success(`Requisition ${r.reqCode} approved successfully.`);
              } else {
                this.msg.error(res.message || 'Failed to approve requisition.');
              }
            },
            error: err => {
              this.msg.error(err?.error?.message || 'Failed to approve requisition.');
            },
          });
        }
      });
  }

  cancelRecord(r: RequisitionRecord): void {
    if (r.status === 'Approved' || r.status === 'Fulfilled') {
      this.msg.warning(`${r.status} requisitions cannot be cancelled or deleted.`);
      return;
    }
    this.modal
      .confirmAction(`Cancel Requisition ${r.reqCode}?`, 'Cancelling will invalidate this procurement record.', 'Cancel Requisition', true)
      .subscribe(confirmed => {
        if (confirmed) {
          this.productService.updateRequisitionStatus(Number(r.id), 'Cancelled').subscribe({
            next: res => {
              if (res.success) {
                this.records.update(list =>
                  list.map(rec => (rec.id === r.id ? { ...rec, status: 'Cancelled' as const } : rec))
                );
                this.msg.success(`Requisition ${r.reqCode} has been marked cancelled.`);
              } else {
                this.msg.error(res.message || 'Failed to cancel requisition.');
              }
            },
            error: err => {
              this.msg.error(err?.error?.message || 'Failed to cancel requisition.');
            },
          });
        }
      });
  }

  exportReport(): void {
    const records = this.filteredRecords();
    if (!records.length) {
      this.msg.warning('No requisition records to export.');
      return;
    }
    const headers = ['SL', 'Requisition Code', 'Date', 'Supplier', 'Items Count', 'Total (BDT)', 'Status', 'Created By'];
    const rows = records.map((r, i) => [
      i + 1,
      `"${r.reqCode}"`,
      `"${r.date}"`,
      `"${r.supplier}"`,
      r.itemsCount,
      r.total.toFixed(2),
      `"${r.status}"`,
      `"${r.createdBy}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `requisitions_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.msg.success(`Exported ${records.length} requisition records.`);
  }
}

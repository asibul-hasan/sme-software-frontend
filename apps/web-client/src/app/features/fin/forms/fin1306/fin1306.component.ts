import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';
import { Fin1306DataService, CashFlow, CashFlowRow } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { isSuccess } from '../../../../core/models/response.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1306',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, CommonTableComponent],
  providers: [Fin1306DataService],
  templateUrl: './fin1306.component.html',
  styles: [`
    :host { display: block; height: 100%; }
    .fill-card { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
    .fill-card > .card-body { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
  `],
})
export class Fin1306Component implements OnInit {
  public permissionService = inject(FormPermissionService);
  private data   = inject(Fin1306DataService);
  private toastr = inject(ToastrService);

  cf        = signal<CashFlow | null>(null);
  isLoading = signal(false);

  private today = new Date();
  from = new Date(this.today.getFullYear(), this.today.getMonth(), 1).toISOString().split('T')[0];
  to   = this.today.toISOString().split('T')[0];

  rows         = computed<CashFlowRow[]>(() => this.cf()?.rows ?? []);
  openingCash  = computed(() => Number(this.cf()?.opening_cash ?? 0));
  totalReceipts = computed(() => Number(this.cf()?.total_receipts ?? 0));
  totalPayments = computed(() => Number(this.cf()?.total_payments ?? 0));
  netCashFlow   = computed(() => Number(this.cf()?.net_cash_flow ?? 0));
  closingCash   = computed(() => Number(this.cf()?.closing_cash ?? 0));

  readonly columns: ColumnDef[] = [
    { title: 'Code',     field: 'account_code', sort: true, cellType: 'text', width: '140px', pin: 'left' },
    { title: 'Account',  field: 'account_name', sort: true, cellType: 'text' },
    { title: 'Opening',  field: 'opening',  cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
    { title: 'Receipts', field: 'receipts', cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
    { title: 'Payments', field: 'payments', cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
    { title: 'Closing',  field: 'closing',  cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
  ];
  readonly config: Partial<TableConfig> = {
    showSearch: true, pagination: false, dense: true, striped: true,
    showActions: false, showColumnToggle: false, showExport: true,
    exportFormats: ['excel', 'pdf', 'csv', 'print'], showTitle: false, maxHeight: '100%',
  };
  readonly tableData = computed(() => this.rows() as unknown as Record<string, unknown>[]);

  ngOnInit(): void {
    setTimeout(() => { this.permissionService.useLocalPermissions('FIN_1306'); this.load(); });
  }

  load(): void {
    this.isLoading.set(true);
    this.data.cashFlow(this.from, this.to).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.cf.set(res.data); },
      error: () => this.toastr.error('Failed to load cash flow'),
    });
  }
}

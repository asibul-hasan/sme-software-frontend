import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { ErpGridComponent, GridConfig, GridColumns } from '../../../../shared/ag-grid';
import { AppDatePickerComponent } from '../../../../shared/components/date-picker';
import { AppDecimalPipe } from '../../../../shared/pipes/app-decimal.pipe';
import { Fin1306DataService, CashFlow, CashFlowRow } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { isSuccess } from '../../../../core/models/response.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1306',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, ErpGridComponent, AppDatePickerComponent, AppDecimalPipe],
  providers: [Fin1306DataService],
  templateUrl: './fin1306.component.html',
  styles: [`:host { display: block; height: 100%; }`],
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

  readonly gridConfig: GridConfig<CashFlowRow> = {
    gridKey: 'FIN_1306_CASH_FLOW_GRID',
    showPagination: false,
    toolbar: { showSearch: true, showExport: true },
    columns: [
      GridColumns.text<CashFlowRow>('account_code', 'Code').width(140).build(),
      GridColumns.text<CashFlowRow>('account_name', 'Account').flex(1).build(),
      GridColumns.decimal<CashFlowRow>('opening', 'Opening').sum().build(),
      GridColumns.decimal<CashFlowRow>('receipts', 'Receipts').sum().build(),
      GridColumns.decimal<CashFlowRow>('payments', 'Payments').sum().build(),
      GridColumns.decimal<CashFlowRow>('closing', 'Closing').sum().build(),
    ]
  };

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

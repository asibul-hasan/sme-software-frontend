import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { ErpGridComponent, GridConfig, GridColumns } from '../../../../shared/ag-grid';
import { AppDatePickerComponent } from '../../../../shared/components/date-picker';
import { Fin1304DataService, ProfitAndLoss, StatementRow } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { isSuccess } from '../../../../core/models/response.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1304',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, ErpGridComponent, AppDatePickerComponent],
  providers: [Fin1304DataService],
  templateUrl: './fin1304.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Fin1304Component implements OnInit {
  public permissionService = inject(FormPermissionService);
  private data   = inject(Fin1304DataService);
  private toastr = inject(ToastrService);

  pnl       = signal<ProfitAndLoss | null>(null);
  isLoading = signal(false);

  private today = new Date();
  from = new Date(this.today.getFullYear(), this.today.getMonth(), 1).toISOString().split('T')[0];
  to   = this.today.toISOString().split('T')[0];

  income      = computed<StatementRow[]>(() => this.pnl()?.income ?? []);
  expense     = computed<StatementRow[]>(() => this.pnl()?.expense ?? []);
  totalIncome  = computed(() => Number(this.pnl()?.total_income ?? 0));
  totalExpense = computed(() => Number(this.pnl()?.total_expense ?? 0));
  netProfit    = computed(() => Number(this.pnl()?.net_profit ?? 0));
  isProfit     = computed(() => this.netProfit() >= 0);

  readonly incomeGridConfig: GridConfig<StatementRow> = {
    gridKey: 'FIN_1304_INCOME_GRID',
    showPagination: false,
    toolbar: { showExport: true },
    columns: [
      GridColumns.text<StatementRow>('account_code', 'Code').width(140).build(),
      GridColumns.text<StatementRow>('account_name', 'Account').flex(1).build(),
      GridColumns.decimal<StatementRow>('amount', 'Amount').sum().build(),
    ]
  };

  readonly expenseGridConfig: GridConfig<StatementRow> = {
    gridKey: 'FIN_1304_EXPENSE_GRID',
    showPagination: false,
    toolbar: { showExport: true },
    columns: [
      GridColumns.text<StatementRow>('account_code', 'Code').width(140).build(),
      GridColumns.text<StatementRow>('account_name', 'Account').flex(1).build(),
      GridColumns.decimal<StatementRow>('amount', 'Amount').sum().build(),
    ]
  };

  ngOnInit(): void {
    setTimeout(() => { this.permissionService.useLocalPermissions('FIN_1304'); this.load(); });
  }

  load(): void {
    this.isLoading.set(true);
    this.data.profitAndLoss(this.from, this.to).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.pnl.set(res.data); },
      error: () => this.toastr.error('Failed to load profit & loss'),
    });
  }
}

import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';
import { Fin1304DataService, ProfitAndLoss, StatementRow } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { isSuccess } from '../../../../core/models/response.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1304',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, CommonTableComponent],
  providers: [Fin1304DataService],
  templateUrl: './fin1304.component.html',
  styles: [`
    :host { display: block; height: 100%; }
    .fill-card { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
    .fill-card > .card-body { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
  `],
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

  readonly columns: ColumnDef[] = [
    { title: 'Code',    field: 'account_code', sort: true, cellType: 'text', width: '140px', pin: 'left' },
    { title: 'Account', field: 'account_name', sort: true, cellType: 'text' },
    { title: 'Amount',  field: 'amount', cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
  ];
  readonly config: Partial<TableConfig> = {
    showSearch: false, pagination: false, dense: true, striped: true,
    showActions: false, showColumnToggle: false, showExport: true,
    exportFormats: ['excel', 'pdf', 'csv', 'print'], showTitle: false, maxHeight: '100%',
  };
  readonly incomeData  = computed(() => this.income() as unknown as Record<string, unknown>[]);
  readonly expenseData = computed(() => this.expense() as unknown as Record<string, unknown>[]);

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

import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { ErpGridComponent, GridConfig, GridColumns } from '../../../../shared/ag-grid';
import { AppDatePickerComponent } from '../../../../shared/components/date-picker';
import { AppDecimalPipe } from '../../../../shared/pipes/app-decimal.pipe';
import { Fin1305DataService, BalanceSheet, StatementRow } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { isSuccess } from '../../../../core/models/response.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1305',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, ErpGridComponent, AppDatePickerComponent, AppDecimalPipe],
  providers: [Fin1305DataService],
  templateUrl: './fin1305.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Fin1305Component implements OnInit {
  public permissionService = inject(FormPermissionService);
  private data   = inject(Fin1305DataService);
  private toastr = inject(ToastrService);

  bs        = signal<BalanceSheet | null>(null);
  isLoading = signal(false);
  asOf      = new Date().toISOString().split('T')[0];

  assets      = computed<StatementRow[]>(() => this.bs()?.assets ?? []);
  liabilities = computed<StatementRow[]>(() => this.bs()?.liabilities ?? []);
  equity      = computed<StatementRow[]>(() => this.bs()?.equity ?? []);
  currentEarnings = computed(() => Number(this.bs()?.current_earnings ?? 0));
  totalAssets     = computed(() => Number(this.bs()?.total_assets ?? 0));
  totalLiab       = computed(() => Number(this.bs()?.total_liabilities ?? 0));
  totalEquity     = computed(() => Number(this.bs()?.total_equity ?? 0));
  totalLiabEquity = computed(() => Number(this.bs()?.total_liabilities_equity ?? 0));
  balanced        = computed(() => this.bs()?.balanced ?? false);

  readonly gridConfig: GridConfig<StatementRow> = {
    gridKey: 'FIN_1305_BALANCE_SHEET_GRID',
    showPagination: false,
    toolbar: { showExport: true },
    columns: [
      GridColumns.text<StatementRow>('account_code', 'Code').width(140).build(),
      GridColumns.text<StatementRow>('account_name', 'Account').flex(1).build(),
      GridColumns.decimal<StatementRow>('amount', 'Amount').sum().build(),
    ]
  };

  ngOnInit(): void {
    setTimeout(() => { this.permissionService.useLocalPermissions('FIN_1305'); this.load(); });
  }

  load(): void {
    this.isLoading.set(true);
    this.data.balanceSheet(this.asOf).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.bs.set(res.data); },
      error: () => this.toastr.error('Failed to load balance sheet'),
    });
  }
}

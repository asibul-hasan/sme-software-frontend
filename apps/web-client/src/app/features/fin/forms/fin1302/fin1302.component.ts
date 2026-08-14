import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { ErpGridComponent, GridConfig, GridColumns } from '../../../../shared/ag-grid';
import { AppDatePickerComponent } from '../../../../shared/components/date-picker';
import { Fin1302DataService, AccountLite, LedgerResult } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { isSuccess } from '../../../../core/models/response.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1302',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, ErpGridComponent, AppDatePickerComponent],
  providers: [Fin1302DataService],
  templateUrl: './fin1302.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Fin1302Component implements OnInit {
  public permissionService = inject(FormPermissionService);
  private data   = inject(Fin1302DataService);
  private toastr = inject(ToastrService);

  accounts   = signal<AccountLite[]>([]);
  result     = signal<LedgerResult | null>(null);
  isLoading  = signal(false);
  accountNo: number | null = null;
  from = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  to   = new Date().toISOString().split('T')[0];

  readonly gridConfig: GridConfig<any> = {
    gridKey: 'FIN_1302_ACCOUNT_LEDGER_GRID',
    showPagination: true,
    pageSize: 25,
    toolbar: { showSearch: true, showExport: true },
    columns: [
      GridColumns.date<any>('voucher_date', 'Date').width(120).build(),
      GridColumns.text<any>('voucher_id', 'Voucher').width(150).build(),
      GridColumns.text<any>('voucher_type_name', 'Type').width(140).build(),
      GridColumns.text<any>('narration', 'Narration').flex(1).build(),
      GridColumns.decimal<any>('debit', 'Debit').sum().build(),
      GridColumns.decimal<any>('credit', 'Credit').sum().build(),
      GridColumns.decimal<any>('running_balance', 'Balance').build(),
    ]
  };

  ngOnInit(): void {
    setTimeout(() => {
      this.permissionService.useLocalPermissions('FIN_1302');
      this.data.loadAccounts().subscribe({ next: (r) => { if (isSuccess(r) && r.data) { this.accounts.set(r.data); if (r.data[0]) { this.accountNo = r.data[0].account_no; this.load(); } } } });
    });
  }

  load(): void {
    if (this.accountNo == null) { this.toastr.warning('Select an account'); return; }
    this.isLoading.set(true);
    this.data.ledger(this.accountNo, this.from, this.to).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.result.set(res.data); },
      error: () => this.toastr.error('Failed to load ledger'),
    });
  }
}

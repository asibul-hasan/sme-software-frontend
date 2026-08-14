import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { ErpGridComponent, GridConfig, GridColumns } from '../../../../shared/ag-grid';
import { AppDatePickerComponent } from '../../../../shared/components/date-picker';
import { Fin1301DataService, TrialBalanceRow } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { isSuccess } from '../../../../core/models/response.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1301',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, ErpGridComponent, AppDatePickerComponent],
  providers: [Fin1301DataService],
  templateUrl: './fin1301.component.html',
  styles: [`
    :host { display: block; height: 100%; }
    .fill-card { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
    .fill-card > .card-body { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
  `],
})
export class Fin1301Component implements OnInit {
  public permissionService = inject(FormPermissionService);
  private data   = inject(Fin1301DataService);
  private toastr = inject(ToastrService);

  rows      = signal<TrialBalanceRow[]>([]);
  isLoading = signal(false);
  asOf      = new Date().toISOString().split('T')[0];

  totalDebit  = computed(() => this.rows().reduce((s, r) => s + (Number(r.debit) || 0), 0));
  totalCredit = computed(() => this.rows().reduce((s, r) => s + (Number(r.credit) || 0), 0));
  balanced    = computed(() => Math.abs(this.totalDebit() - this.totalCredit()) < 0.005);

  readonly gridConfig: GridConfig<TrialBalanceRow> = {
    gridKey: 'FIN_1301_TRIAL_BALANCE_GRID',
    showPagination: true,
    pageSize: 25,
    toolbar: { showSearch: true, showExport: true },
    columns: [
      GridColumns.text('account_code', 'Code').width(140).build(),
      GridColumns.text('account_name', 'Account').flex(1).build(),
      GridColumns.decimal('debit', 'Debit').sum().build(),
      GridColumns.decimal('credit', 'Credit').sum().build(),
    ]
  };

  ngOnInit(): void {
    setTimeout(() => { this.permissionService.useLocalPermissions('FIN_1301'); this.load(); });
  }

  load(): void {
    this.isLoading.set(true);
    this.data.trialBalance(this.asOf).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.rows.set(res.data); },
      error: () => this.toastr.error('Failed to load trial balance'),
    });
  }
}

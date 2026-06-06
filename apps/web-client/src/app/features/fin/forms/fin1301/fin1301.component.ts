import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';
import { Fin1301DataService, TrialBalanceRow } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { isSuccess } from '../../../../core/models/response.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1301',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, CommonTableComponent],
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

  readonly columns: ColumnDef[] = [
    { title: 'Code',    field: 'account_code', sort: true, cellType: 'text', width: '140px', pin: 'left' },
    { title: 'Account', field: 'account_name', sort: true, cellType: 'text' },
    { title: 'Debit',   field: 'debit',  cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
    { title: 'Credit',  field: 'credit', cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
  ];
  readonly config: Partial<TableConfig> = {
    showSearch: true, pagination: true, defaultPageSize: 25, dense: true, striped: true,
    showActions: false, showColumnToggle: false, showExport: true,
    exportFormats: ['excel', 'pdf', 'csv', 'print'], showTitle: false, maxHeight: '100%',
  };
  readonly tableData = computed(() => this.rows() as unknown as Record<string, unknown>[]);

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

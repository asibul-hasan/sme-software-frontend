import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';
import { Fin1303DataService, DayBookRow } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { isSuccess } from '../../../../core/models/response.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1303',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, CommonTableComponent],
  providers: [Fin1303DataService],
  templateUrl: './fin1303.component.html',
  styles: [`
    :host { display: block; height: 100%; }
    .fill-card { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
    .fill-card > .card-body { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
  `],
})
export class Fin1303Component implements OnInit {
  public permissionService = inject(FormPermissionService);
  private data   = inject(Fin1303DataService);
  private toastr = inject(ToastrService);

  rows      = signal<DayBookRow[]>([]);
  isLoading = signal(false);
  from = new Date().toISOString().split('T')[0];
  to   = new Date().toISOString().split('T')[0];

  readonly columns: ColumnDef[] = [
    { title: 'Date',      field: 'voucher_date', sort: true, cellType: 'text', width: '120px' },
    { title: 'Voucher',   field: 'voucher_id',   sort: true, cellType: 'text', width: '150px' },
    { title: 'Type',      field: 'voucher_type_name', cellType: 'text', width: '130px' },
    { title: 'Account',   field: 'account_name', sort: true, cellType: 'text' },
    { title: 'Narration', field: 'narration',    cellType: 'text' },
    { title: 'Debit',     field: 'debit',  cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
    { title: 'Credit',    field: 'credit', cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
  ];
  readonly config: Partial<TableConfig> = {
    showSearch: true, pagination: true, defaultPageSize: 25, dense: true, striped: true,
    showActions: false, showColumnToggle: true, showExport: true,
    exportFormats: ['excel', 'pdf', 'csv', 'print'], showTitle: false, maxHeight: '100%',
  };
  readonly tableData = computed(() => this.rows() as unknown as Record<string, unknown>[]);

  ngOnInit(): void { setTimeout(() => { this.permissionService.useLocalPermissions('FIN_1303'); this.load(); }); }

  load(): void {
    this.isLoading.set(true);
    this.data.dayBook(this.from, this.to).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.rows.set(res.data); },
      error: () => this.toastr.error('Failed to load day book'),
    });
  }
}

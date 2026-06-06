import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';
import { Fin1201DataService, OutboxEvent } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { isSuccess } from '../../../../core/models/response.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1201',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, CommonTableComponent],
  providers: [Fin1201DataService],
  templateUrl: './fin1201.component.html',
  styles: [`
    :host { display: block; height: 100%; }
    .fill-card { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
    .fill-card > .card-body { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
  `],
})
export class Fin1201Component implements OnInit {
  public permissionService = inject(FormPermissionService);
  private data   = inject(Fin1201DataService);
  private toastr = inject(ToastrService);

  rows      = signal<OutboxEvent[]>([]);
  isLoading = signal(false);
  isBusy    = signal(false);
  status    = 3;   // default Failed

  readonly statusOptions = [
    { value: 3, label: 'Failed (parked)' },
    { value: 1, label: 'Pending' },
    { value: 2, label: 'Published' },
  ];

  readonly columns: ColumnDef[] = [
    { title: 'Event #', field: 'event_no',      sort: true, cellType: 'number', width: '90px' },
    { title: 'Type',    field: 'event_type',    sort: true, cellType: 'text' },
    { title: 'Source',  field: 'aggregate_type', cellType: 'text', width: '140px' },
    { title: 'Doc',     field: 'aggregate_id',  cellType: 'text', width: '90px' },
    { title: 'Retries', field: 'retry_count',   cellType: 'number', align: 'center', width: '90px' },
    { title: 'Created', field: 'created_at',    cellType: 'datepipe', dateFormat: 'dd/MM/yy HH:mm', width: '150px' },
  ];
  readonly config: Partial<TableConfig> = {
    showSearch: true, pagination: true, defaultPageSize: 20, dense: true, striped: true,
    showColumnToggle: false, showExport: false, showTitle: false, maxHeight: '100%',
    showActions: true,
    actions: [{ type: 'custom', icon: 'replay', tooltip: 'Re-drive', variant: 'primary', visible: () => this.status !== 2, onClick: (row) => this.redrive(row['event_no'] as number) }],
  };
  readonly tableData = computed(() => this.rows() as unknown as Record<string, unknown>[]);

  ngOnInit(): void { setTimeout(() => { this.permissionService.useLocalPermissions('FIN_1201'); this.load(); }); }

  load(): void {
    this.isLoading.set(true);
    this.data.events(this.status).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.rows.set(res.data); },
      error: () => this.toastr.error('Failed to load events'),
    });
  }

  drain(): void {
    this.isBusy.set(true);
    this.data.drain().pipe(finalize(() => this.isBusy.set(false))).subscribe({
      next: (res) => { if (isSuccess(res)) { this.toastr.success(`Drained ${res.data?.handled ?? 0} event(s)`); this.load(); } },
      error: (err) => this.toastr.error(err?.error?.message || 'Drain failed'),
    });
  }

  redrive(no: number): void {
    this.isBusy.set(true);
    this.data.redrive(no).pipe(finalize(() => this.isBusy.set(false))).subscribe({
      next: (res) => { if (isSuccess(res)) { this.toastr.success('Event re-driven'); this.load(); } },
      error: (err) => this.toastr.error(err?.error?.message || 'Re-drive failed'),
    });
  }
}

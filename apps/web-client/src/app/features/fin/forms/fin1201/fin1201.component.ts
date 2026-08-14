import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { Fin1201DataService, OutboxEvent } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { isSuccess } from '../../../../core/models/response.model';
import { ToastrService } from 'ngx-toastr';
import { ErpGridComponent, GridConfig, GridColumns } from '../../../../shared/ag-grid';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1201',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, ErpGridComponent],
  providers: [Fin1201DataService],
  templateUrl: './fin1201.component.html',
  styles: [`
    :host { display: block; height: 100%; }
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

  readonly gridConfig: GridConfig<OutboxEvent> = {
    gridKey: 'FIN_1201_EVENTS_GRID',
    rowIdField: 'event_no',
    showPagination: true,
    pageSize: 20,
    canAdd: () => false,
    canEdit: () => false,
    canDeleteRow: () => false,
    toolbar: {
      showAdd: false,
      showSearch: true,
      showExport: false,
    },
    columns: [
      GridColumns.number<OutboxEvent>('event_no', 'Event #').width(90).build(),
      GridColumns.text<OutboxEvent>('event_type', 'Type').build(),
      GridColumns.text<OutboxEvent>('aggregate_type', 'Source').width(140).build(),
      GridColumns.text<OutboxEvent>('aggregate_id', 'Doc').width(90).build(),
      GridColumns.text<OutboxEvent>('status', 'Status').width(130).align('center').cellRenderer((params) => {
        const s = params.value;
        if (s === 3) return `<span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">Failed</span>`;
        if (s === 1) return `<span class="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">Pending</span>`;
        if (s === 2) return `<span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">Published</span>`;
        return '';
      }).build(),
      GridColumns.number<OutboxEvent>('retry_count', 'Retries').align('center').width(90).build(),
      GridColumns.date<OutboxEvent>('created_at', 'Created').width(150).valueFormatter((params) => params.value ? new Date(params.value).toLocaleString() : '').build(),
      {
        field: '__actions',
        headerName: '',
        width: 60,
        pinned: 'right',
        sortable: false,
        filterable: false,
        cellRenderer: (params) => {
          if (params.data && params.data.status !== 2) {
            const btn = document.createElement('button');
            btn.className = 'btn-action btn-new';
            btn.title = 'Re-drive';
            btn.style.padding = '4px';
            btn.innerHTML = '<span class="material-icons text-primary" style="font-size:18px;">replay</span>';
            btn.onclick = (e) => {
              e.stopPropagation();
              this.redrive(params.data.event_no);
            };
            return btn;
          }
          return '';
        }
      }
    ]
  };

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

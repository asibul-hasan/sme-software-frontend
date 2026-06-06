import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared/shared.module';
import {
  CommonTableComponent,
  ColumnDef,
  TableConfig,
  TableAction,
} from '../../../../shared/components/common-table';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import {
  ApprovalInboxDataService,
  PendingApproval,
} from './services/data.service';
import { isSuccess } from '../../../../core/models/response.model';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-approval-inbox',
  standalone: true,
  imports: [CommonModule, SharedModule, CommonTableComponent],
  providers: [ApprovalInboxDataService],
  templateUrl: './approval-inbox.component.html',
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class ApprovalInboxComponent implements OnInit {
  private data = inject(ApprovalInboxDataService);
  private toastr = inject(ToastrService);
  private alert = inject(AlertService);

  readonly pending = signal<PendingApproval[]>([]);
  readonly isLoading = signal(false);

  /** Friendly labels for the document_type registry. */
  private readonly docLabels: Record<string, string> = {
    HRM_LEAVE: 'Leave Application',
    HRM_PAYROLL: 'Payroll Run',
    HRM_ATT_ADJ: 'Attendance Adjustment',
    HRM_REQUISITION: 'Job Requisition',
    HRM_SEPARATION: 'Separation',
    HRM_FINAL_SETTLEMENT: 'Final Settlement',
  };
  docLabel(t: string): string {
    return this.docLabels[t] ?? t;
  }

  readonly columns: ColumnDef[] = [
    {
      title: 'Document',
      field: 'document_label',
      sort: true,
      cellType: 'text',
    },
    {
      title: 'Ref',
      field: 'document_no',
      sort: true,
      cellType: 'text',
      width: '140px',
    },
    {
      title: 'Amount',
      field: 'amount',
      cellType: 'decimal',
      align: 'right',
      precision: 2,
      width: '140px',
    },
    {
      title: 'Step',
      field: 'current_step',
      cellType: 'number',
      align: 'center',
      width: '80px',
    },
    {
      title: 'Requested',
      field: 'requested_at',
      cellType: 'datepipe',
      dateFormat: 'dd MMM yyyy, HH:mm',
      width: '170px',
    },
  ];

  private readonly actions: TableAction[] = [
    {
      type: 'custom',
      icon: 'check_circle',
      label: 'Approve',
      variant: 'success',
      onClick: (row) => this.approve(row['approval_request_no'] as number),
    },
    {
      type: 'custom',
      icon: 'cancel',
      label: 'Reject',
      variant: 'danger',
      onClick: (row) => this.reject(row['approval_request_no'] as number),
    },
  ];

  readonly config: Partial<TableConfig> = {
    showSearch: true,
    pagination: true,
    defaultPageSize: 15,
    dense: true,
    striped: true,
    showColumnToggle: false,
    showExport: false,
    showActions: true,
    actions: this.actions,
    showTitle: false,
    maxHeight: '100%',
  };

  readonly tableData = computed(
    () =>
      this.pending().map((p) => ({
        ...p,
        document_label: this.docLabel(p.document_type),
      })) as unknown as Record<string, unknown>[],
  );

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.isLoading.set(true);
    this.data
      .loadPending()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) this.pending.set(res.data);
        },
        error: () => this.toastr.error('Failed to load pending approvals'),
      });
  }

  approve(no: number): void {
    this.alert
      .confirm(
        'Approve this request? Advances the workflow or completes it.',
        'Approve',
        'primary',
      )
      .subscribe((ok) => {
        if (!ok) return;
        this.data.approve(no).subscribe({
          next: (res) => {
            if (isSuccess(res)) {
              this.toastr.success('Approved');
              this.reload();
            } else this.toastr.error(res.message || 'Approve failed');
          },
          error: (err) =>
            this.toastr.error(err?.error?.message || 'Approve failed'),
        });
      });
  }

  reject(no: number): void {
    this.alert
      .confirm('Reject this request?', 'Reject', 'warn')
      .subscribe((ok) => {
        if (!ok) return;
        this.data.reject(no).subscribe({
          next: (res) => {
            if (isSuccess(res)) {
              this.toastr.success('Rejected');
              this.reload();
            } else this.toastr.error(res.message || 'Reject failed');
          },
          error: (err) =>
            this.toastr.error(err?.error?.message || 'Reject failed'),
        });
      });
  }
}

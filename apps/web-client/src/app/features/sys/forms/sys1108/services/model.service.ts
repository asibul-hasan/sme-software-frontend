import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';
import { resolvePostReloadSelection } from '../../../../../core/utils/list-selection.utils';
import { Sys1108DataService } from './data.service';

export interface ISysLookup {
  value: number;
  label: string;
}

export interface IApprovalWorkflow {
  workflow_no: number;
  document_type: string;
  branch_no?: number | null;
  step_number: number;
  amount_min?: number | null;
  amount_max?: number | null;
  approver_role_no: number;
  approver_role_label?: string | null;
  is_final: number;
  is_active: number;
  row_version?: number;
}

@Injectable()
export class Sys1108ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Sys1108DataService);
  private toastr = inject(ToastrService);

  items = signal<IApprovalWorkflow[]>([]);
  roleOptions = signal<ISysLookup[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');
  selectedNo = signal<number | null>(null);
  form!: FormGroup;

  /** Curated document types that flow through approvals across INV/SAL/PUR. */
  readonly documentTypes: string[] = [
    'PURCHASE_REQUISITION',
    'PURCHASE_ORDER',
    'GRN',
    'PURCHASE_RETURN',
    'SALES_ORDER',
    'SALES_INVOICE',
    'SALES_RETURN',
    'STOCK_ADJUSTMENT',
    'STOCK_TRANSFER',
    'PAYMENT',
    'RECEIPT',
    'JOURNAL_VOUCHER',
    'EXPENSE',
  ];

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const data = this.items();
    if (!term) return data;
    return data.filter(
      (w) =>
        (w.document_type || '').toLowerCase().includes(term) ||
        (w.approver_role_label || '').toLowerCase().includes(term),
    );
  });

  pager = makePaginator<IApprovalWorkflow>(this.filtered);

  initForm(): void {
    this.form = this.fb.group({
      workflow_no: [null],
      document_type: ['', [Validators.required, Validators.maxLength(30)]],
      step_number: [1, [Validators.required, Validators.min(1)]],
      approver_role_no: [null, [Validators.required]],
      amount_min: [0],
      amount_max: [null],
      is_final: [0, [Validators.required]],
      is_active: [1, [Validators.required]],
    });
  }

  loadRoleOptions(): void {
    this.data.getRoleOptions().subscribe((res) => {
      if (isSuccess(res) && res.data) this.roleOptions.set(res.data);
    });
  }

  loadList(reselectNo: number | null = null): void {
    this.isLoading.set(true);
    this.data
      .getList()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) {
          this.items.set(res.data);
          const resolved = resolvePostReloadSelection(res.data, (w: IApprovalWorkflow) => w.workflow_no, reselectNo);
          resolved ? this.select(resolved.item as IApprovalWorkflow) : this.onNew();
        }
      });
  }

  select(item: IApprovalWorkflow): void {
    this.selectedNo.set(item.workflow_no);
    this.form.patchValue({
      workflow_no: item.workflow_no,
      document_type: item.document_type,
      step_number: item.step_number ?? 1,
      approver_role_no: item.approver_role_no ?? null,
      amount_min: item.amount_min ?? 0,
      amount_max: item.amount_max ?? null,
      is_final: item.is_final ?? 0,
      is_active: item.is_active ?? 1,
    });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Please correct the validation errors.');
      return;
    }
    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedNo();
    this.isSaving.set(true);
    this.data
      .save({ ...val, workflow_no: this.selectedNo() })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success(isUpdate ? 'Approval rule updated' : 'Approval rule created');
            this.loadList(isUpdate ? this.selectedNo() : (res.data?.workflow_no ?? null));
          } else {
            this.toastr.error(res.message || 'Save failed');
          }
        },
        error: (err) => this.toastr.error(err?.error?.message || 'API error during save'),
      });
  }

  onDelete(): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isLoading.set(true);
    this.data
      .delete(no)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success('Approval rule deleted');
            this.loadList();
          } else {
            this.toastr.error(res.message || 'Delete failed');
          }
        },
        error: (err) => this.toastr.error(err?.error?.message || 'API error during delete'),
      });
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.form.reset({ step_number: 1, amount_min: 0, is_final: 0, is_active: 1 });
  }
}

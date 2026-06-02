import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { resolvePostReloadSelection } from '../../../../../core/utils/list-selection.utils';
import { Sys1007DataService } from './data.service';
import { AuthContextService } from '../../../../../core/services/auth-context.service';
import { CommonLookupService, BranchLookupDto } from '../../../../../core/services/common-lookup.service';

export interface ICostCenter {
  cost_center_no: number;
  cost_center_id: string;
  cost_center_name: string;
  branch_no?: number | null;
  parent_cost_center_no?: number | null;
  is_active: number;
  row_version?: number;
}

/**
 * SYS1007 Cost Center model.
 *
 * The hierarchy (tree building, expand/collapse, connector lines, search) is
 * fully owned by the reusable `<app-tree-view>` component — this service only
 * holds the flat list, the current selection, and the edit form.
 */
@Injectable()
export class Sys1007ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Sys1007DataService);
  private toastr = inject(ToastrService);
  private authCtx = inject(AuthContextService);
  private lookup = inject(CommonLookupService);

  items = signal<ICostCenter[]>([]);
  branches = signal<BranchLookupDto[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');
  selectedNo = signal<number | null>(null);
  /** Tracks the parent control so the UI can show the branch picker only for roots. */
  parentNo = signal<number | null>(null);
  form!: FormGroup;

  /** Current logged-in branch — the default branch assignment on New. */
  private get currentBranchNo(): number | null {
    return this.authCtx.user()?.branch_no ?? null;
  }

  /**
   * Branch assignment is only chosen for ROOT cost centers (no parent).
   * Children inherit their parent's branch, so the picker is hidden for them.
   */
  isRoot = computed(() => this.parentNo() == null);

  /** Parent dropdown options — every cost center except the one being edited. */
  parentOptions = computed(() =>
    this.items().filter((c) => c.cost_center_no !== this.selectedNo()),
  );

  initForm(): void {
    this.form = this.fb.group({
      cost_center_no: [null],
      cost_center_id: ['', [Validators.required, Validators.maxLength(20)]],
      cost_center_name: ['', [Validators.required, Validators.maxLength(150)]],
      parent_cost_center_no: [null],
      branch_nos: [[] as number[]],   // honoured only for roots; empty = all branches
      is_active: [1, [Validators.required]],
    });
    // Keep the parentNo signal in sync so isRoot() drives the branch picker visibility.
    this.form.get('parent_cost_center_no')?.valueChanges.subscribe((v) => this.parentNo.set(v ?? null));
  }

  loadBranches(): void {
    this.lookup.getBranches().subscribe((list) => this.branches.set(list));
  }

  loadList(reselectNo: number | null = null): void {
    this.isLoading.set(true);
    this.data
      .getList()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) {
          this.items.set(res.data);
          const resolved = resolvePostReloadSelection(res.data, (c: ICostCenter) => c.cost_center_no, reselectNo);
          resolved ? this.select(resolved.item as ICostCenter) : this.onNew();
        }
      });
  }

  /** True when the currently-selected cost center has child records (parent is then locked). */
  selectedHasChildren = computed(() =>
    this.selectedNo() != null &&
    this.items().some((c) => c.parent_cost_center_no === this.selectedNo()),
  );

  select(item: ICostCenter): void {
    this.selectedNo.set(item.cost_center_no);
    this.parentNo.set(item.parent_cost_center_no ?? null);
    this.form.patchValue({
      cost_center_no: item.cost_center_no,
      cost_center_id: item.cost_center_id,
      cost_center_name: item.cost_center_name,
      parent_cost_center_no: item.parent_cost_center_no ?? null,
      branch_nos: item.branch_no != null ? [item.branch_no] : [],
      is_active: item.is_active ?? 1,
    });
    // Lock the parent picker if this node has children — it cannot be re-parented.
    const parentCtrl = this.form.get('parent_cost_center_no');
    const hasChildren = this.items().some((c) => c.parent_cost_center_no === item.cost_center_no);
    hasChildren ? parentCtrl?.disable({ emitEvent: false }) : parentCtrl?.enable({ emitEvent: false });
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
      .save({ ...val, cost_center_no: this.selectedNo() })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success(isUpdate ? 'Cost center updated' : 'Cost center created');
            this.loadList(isUpdate ? this.selectedNo() : (res.data?.cost_center_no ?? null));
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
            this.toastr.success('Cost center deleted');
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
    this.parentNo.set(null);
    this.form.get('parent_cost_center_no')?.enable({ emitEvent: false });
    this.form.reset({
      is_active: 1,
      // Root by default → default the branch assignment to the current login branch.
      branch_nos: this.currentBranchNo != null ? [this.currentBranchNo] : [],
    });
  }
}

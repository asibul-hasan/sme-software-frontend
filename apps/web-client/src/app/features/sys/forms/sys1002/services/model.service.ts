import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { Sys1002DataService, Sys1002BranchDto } from './data.service';
import { CommonLookupService, EmployeeLookupDto } from '../../../../../core/services/common-lookup.service';
import { isSuccess } from '../../../../../core/models/response.model';
import { resolvePostReloadSelection } from '../../../../../core/utils/list-selection.utils';
import { makePaginator, SortDirection } from '../../../../../core/utils/paginator';
import { AuthContextService } from '../../../../../core/services/auth-context.service';

/** @deprecated Use Sys1002BranchDto instead. Kept for backward compatibility with sys1003/1004/1005. */
export type IBranch = Sys1002BranchDto;

@Injectable()
export class Sys1002ModelService {
  private fb       = inject(FormBuilder);
  private data     = inject(Sys1002DataService);
  private lookup   = inject(CommonLookupService);
  private toastr   = inject(ToastrService);
  private translate = inject(TranslateService);
  private authCtx  = inject(AuthContextService);

  // ─── State ─────────────────────────────────────────────────────────────────
  branches = signal<Sys1002BranchDto[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');
  selectedBranchNo = signal<number | null>(null);
  employees = signal<EmployeeLookupDto[]>([]);
  sortDirection = signal<SortDirection>('');

  form!: FormGroup;

  // ─── Derived State ──────────────────────────────────────────────────────────

  /**
   * True when any branch in the list has is_main_branch = 1.
   * Once a main branch exists it is permanently locked — you cannot
   * uncheck the flag on that record, nor set another branch as main.
   */
  isMainBranchLocked = computed(() =>
    this.branches().some(b => b.is_main_branch === 1)
  );

  /**
   * Controls visibility of the Main Branch checkbox.
   *
   * Show only when:
   *  - Creating a NEW branch and no main branch exists yet (first branch of the
   *    company → it will automatically become the main branch).
   *  - Editing an EXISTING branch that IS already the main branch.
   *
   * For every other branch the checkbox is completely hidden — there can only
   * ever be one main branch, and it is set permanently on first creation.
   */
  showMainBranchFlag = computed(() => {
    const selectedNo = this.selectedBranchNo();
    if (selectedNo === null) {
      // New-branch form: show only when no main branch exists yet.
      return !this.isMainBranchLocked();
    }
    // Editing: show only for the branch that IS the main branch.
    return this.branches().some(
      b => b.branch_no === selectedNo && b.is_main_branch === 1
    );
  });

  filteredBranches = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const data = this.branches();
    const filtered = !term
      ? data
      : data.filter(
          (b) =>
            (b.branch_name || '').toLowerCase().includes(term) ||
            (b.branch_id || '').toLowerCase().includes(term),
        );
    // Default: descending by PK — newest branch on top. The sidebar sort
    // toggle reverses this order for ascending (oldest first).
    if (this.sortDirection() === '') return filtered;
    const sorted = [...filtered].sort((a, b) => (b.branch_no ?? 0) - (a.branch_no ?? 0));
    return this.sortDirection() === 'desc' ? sorted : [...sorted].reverse();
  });

  pager = makePaginator<Sys1002BranchDto>(this.filteredBranches);

  loadEmployees(): void {
    this.lookup.getEmployees().subscribe((employees) => {
      this.employees.set(employees);
    });
  }

  // ─── Form ───────────────────────────────────────────────────────────────────
  initForm(): void {
    this.form = this.fb.group({
      branch_no:            [null],
      company_no:           [this.authCtx.user()?.company_no ?? null],
      branch_id:            [''],
      branch_name:          ['', [Validators.required, Validators.maxLength(250)]],
      branch_name_nls:      [''],
      branch_type:          [''],
      branch_addr1:         [''],
      branch_addr2:         [''],
      city:                 [''],
      post_code:            [''],
      mobile_no:            [''],
      contact_no:           [''],
      email:                ['', Validators.email],
      manager_employee_no:  [null],
      is_main_branch:       [0],
      is_active:            [1, Validators.required],
    });
  }

  // ─── CRUD ───────────────────────────────────────────────────────────────────
  loadBranches(reselectNo: number | null = null): void {
    this.isLoading.set(true);
    this.data
      .getBranchList()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            this.branches.set(res.data);
            const resolved = resolvePostReloadSelection(
              res.data,
              (b: Sys1002BranchDto) => b.branch_no,
              reselectNo,
            );
            resolved ? this.selectBranch(resolved.item as Sys1002BranchDto) : this.onNew();
          }
        },
      });
  }

  selectBranch(branch: Sys1002BranchDto): void {
    this.selectedBranchNo.set(branch.branch_no);
    this.isLoading.set(true);

    this.data
      .getBranchDetail(branch.branch_no!)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            this.patchForm(res.data);
          }
        },
      });
  }

  patchForm(d: Sys1002BranchDto): void {
    this.form.patchValue({
      branch_no:            d.branch_no,
      company_no:           d.company_no,
      branch_id:            d.branch_id,
      branch_name:          d.branch_name,
      branch_name_nls:      d.branch_name_nls,
      branch_type:          d.branch_type,
      branch_addr1:         d.branch_addr1,
      branch_addr2:         d.branch_addr2,
      city:                 d.city,
      post_code:            d.post_code,
      mobile_no:            d.mobile_no,
      contact_no:           d.contact_no,
      email:                d.email,
      manager_employee_no:  d.manager_employee_no,
      is_main_branch:       d.is_main_branch === 1,
      is_active:            d.is_active ?? 1,
    });
  }

  onSave(callback?: () => void): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning(this.translate.instant('validationErrors'));
      return;
    }

    const val      = this.form.getRawValue();
    const isUpdate = !!this.selectedBranchNo();
    const wantsMain = val.is_main_branch === true || val.is_main_branch === 1;

    // Guard: prevent creating a second main branch
    if (wantsMain && this.isMainBranchLocked()) {
      const currentMainNo = this.branches().find(b => b.is_main_branch === 1)?.branch_no;
      if (!isUpdate || currentMainNo !== this.selectedBranchNo()) {
        this.toastr.error(this.translate.instant('mainBranchExists'));
        return;
      }
    }

    this.isSaving.set(true);
    const payload: Sys1002BranchDto = {
      ...val,
      branch_no:     this.selectedBranchNo(),
      is_main_branch: wantsMain ? 1 : 0,
      is_active:      val.is_active === true ? 1 : val.is_active === false ? 0 : val.is_active,
    };

    this.data
      .saveBranch(payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success(this.translate.instant(isUpdate ? 'branchUpdated' : 'branchCreated'));
            // After create: select the new record by its PK from the response.
            // After update: keep the current selection.
            const savedNo = isUpdate
              ? this.selectedBranchNo()
              : res.data?.branch_no ?? null;
            this.loadBranches(savedNo);
            if (callback) callback();
          }
        },
      });
  }

  onDelete(callback?: () => void): void {
    const branchNo = this.selectedBranchNo();
    if (!branchNo) return;

    this.isLoading.set(true);
    this.data
      .deleteBranch(branchNo)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success(this.translate.instant('branchDeleted'));
            this.loadBranches();
            if (callback) callback();
          }
        },
      });
  }

  onNew(): void {
    this.selectedBranchNo.set(null);
    this.form.reset({
      is_active:      1,
      company_no:     this.authCtx.user()?.company_no ?? null,
      // First branch of the company is always the main branch — auto-checked.
      is_main_branch: !this.isMainBranchLocked() ? 1 : 0,
    });
  }
}

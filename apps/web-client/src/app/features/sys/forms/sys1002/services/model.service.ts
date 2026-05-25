import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Sys1002DataService, Sys1002BranchDto, Sys1002EmployeeDto } from './data.service';
import { isSuccess } from '../../../../../core/models/response.model';
import { resolvePostReloadSelection } from '../../../../../core/utils/list-selection.utils';
import { makePaginator } from '../../../../../core/utils/paginator';
import { AuthContextService } from '../../../../../core/services/auth-context.service';

/** @deprecated Use Sys1002BranchDto instead. Kept for backward compatibility with sys1003/1004/1005. */
export type IBranch = Sys1002BranchDto;

@Injectable()
export class Sys1002ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Sys1002DataService);
  private toastr = inject(ToastrService);
  private authCtx = inject(AuthContextService);

  // ─── State ─────────────────────────────────────────────────────────────────
  branches = signal<Sys1002BranchDto[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');
  selectedBranchNo = signal<number | null>(null);
  employees = signal<Sys1002EmployeeDto[]>([]);

  form!: FormGroup;

  // ─── Derived State ──────────────────────────────────────────────────────────
  filteredBranches = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const data = this.branches();
    if (!term) return data;
    return data.filter(
      (b) =>
        (b.branch_name || '').toLowerCase().includes(term) ||
        (b.branch_id || '').toLowerCase().includes(term),
    );
  });

  pager = makePaginator<Sys1002BranchDto>(this.filteredBranches);

  loadEmployees(): void {
    this.data.getEmployees().subscribe((res) => {
      if (isSuccess(res) && res.data) {
        this.employees.set(res.data);
      }
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
      this.toastr.warning('Please correct the validation errors.');
      return;
    }

    this.isSaving.set(true);
    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedBranchNo();
    const payload: Sys1002BranchDto = {
      ...val,
      branch_no: this.selectedBranchNo(),
      is_main_branch: val.is_main_branch === true ? 1 : val.is_main_branch === false ? 0 : val.is_main_branch,
      is_active: val.is_active === true ? 1 : val.is_active === false ? 0 : val.is_active,
    };

    this.data
      .saveBranch(payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success(isUpdate ? 'Branch updated' : 'Branch created');
            this.loadBranches(isUpdate ? this.selectedBranchNo() : null);
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
            this.toastr.success('Branch deleted successfully');
            this.loadBranches();
            if (callback) callback();
          }
        },
      });
  }

  onNew(): void {
    this.selectedBranchNo.set(null);
    this.form.reset({
      is_active:  1,
      company_no: this.authCtx.user()?.company_no ?? null,
    });
  }
}

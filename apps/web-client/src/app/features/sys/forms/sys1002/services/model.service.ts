import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { Sys1002DataService } from './data.service';

// ─── Domain Interface ────────────────────────────────────────────────────────

export interface Branch {
  branchNo: number;
  branchCode: string;
  branchName: string;
  branchNameLocal?: string;
  branchType?: string;
  isHeadOffice?: boolean | number;
  addressLine1?: string;
  city?: string;
  phonePrimary?: string;
  email?: string;
  managerUserNo?: string | number;
  costCenterCode?: string;
  openingDate?: string | Date;
  status?: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * State + form service for SYS1002 – Branch Setup.
 *
 * Responsibilities:
 *  - Reactive signals (branches list, loading flags, selection)
 *  - FormGroup construction and patching
 *  - Orchestration of Sys1002DataService calls
 *
 * HTTP endpoint paths and request construction live in Sys1002DataService.
 */
@Injectable()
export class Sys1002ModelService {
  private fb        = inject(FormBuilder);
  private data      = inject(Sys1002DataService);
  private toastr    = inject(ToastrService);
  private datePipe  = inject(DatePipe);

  // ─── State ─────────────────────────────────────────────────────────────────
  branches            = signal<Branch[]>([]);
  isLoading           = signal(false);
  isSaving            = signal(false);
  searchTerm          = signal('');
  selectedBranchNo    = signal<number | null>(null);
  lastSelectedBranchIndex = 0;

  form!: FormGroup;

  // ─── Derived State ──────────────────────────────────────────────────────────
  filteredBranches = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const data = this.branches();
    if (!term) return data;
    return data.filter(
      (b) =>
        (b.branchName || '').toLowerCase().includes(term) ||
        (b.branchCode || '').toLowerCase().includes(term),
    );
  });

  // ─── Form ───────────────────────────────────────────────────────────────────
  initForm(): void {
    this.form = this.fb.group({
      branch_code:       ['', [Validators.required, Validators.maxLength(20)]],
      branch_name:       ['', Validators.required],
      branch_name_local: [''],
      branch_type:       [''],
      is_head_office:    [false],
      address_line1:     [''],
      city:              [''],
      phone_primary:     [''],
      email:             ['', Validators.email],
      manager_user_no:   [''],
      cost_center_code:  [''],
      opening_date:      [''],
      status:            ['Active'],
    });
  }

  // ─── CRUD ───────────────────────────────────────────────────────────────────
  loadBranches(reselectIndex?: number): void {
    this.isLoading.set(true);
    this.data
      .loadBranches()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.branches.set(res.data);
            if (res.data.length > 0) {
              const index =
                reselectIndex !== undefined && reselectIndex < res.data.length
                  ? reselectIndex
                  : 0;
              this.selectBranch(res.data[index], index);
            } else {
              this.onNew();
            }
          }
        },
        error: () => this.toastr.error('Failed to load branches'),
      });
  }

  selectBranch(branch: Branch, index?: number): void {
    if (index !== undefined) this.lastSelectedBranchIndex = index;
    this.selectedBranchNo.set(branch.branchNo);
    this.isLoading.set(true);

    this.data
      .loadBranchDetail(branch.branchNo)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const d = res.data;
            this.form.patchValue({
              branch_code:       d.branchCode,
              branch_name:       d.branchName,
              branch_name_local: d.branchNameLocal,
              branch_type:       d.branchType,
              is_head_office:    !!d.isHeadOffice,
              address_line1:     d.addressLine1,
              city:              d.city,
              phone_primary:     d.phonePrimary,
              email:             d.email,
              manager_user_no:   d.managerUserNo ?? '',
              cost_center_code:  d.costCenterCode,
              opening_date:      d.openingDate ? new Date(d.openingDate) : null,
              status:            d.status || 'Active',
            });
          }
        },
      });
  }

  onSave(callback?: () => void): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Please correct the validation errors.');
      return;
    }

    this.isSaving.set(true);
    const val     = this.form.value;
    const isUpdate = !!this.selectedBranchNo();
    const payload  = {
      ...val,
      branch_no:     this.selectedBranchNo(),
      is_head_office: val.is_head_office ? 1 : 0,
      opening_date:  val.opening_date
        ? this.datePipe.transform(val.opening_date, 'yyyy-MM-dd')
        : null,
    };

    const obs = isUpdate
      ? this.data.updateBranch(payload)
      : this.data.saveBranch(payload);

    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success(isUpdate ? 'Branch updated' : 'Branch created');
          this.loadBranches(isUpdate ? this.lastSelectedBranchIndex : 0);
          if (callback) callback();
        } else {
          this.toastr.error(res.message || 'Save failed');
        }
      },
      error: () => this.toastr.error('Server error during save'),
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
          if (res.success) {
            this.toastr.success('Branch deleted successfully');
            this.loadBranches();
            if (callback) callback();
          } else {
            this.toastr.error(res.message || 'Delete failed');
          }
        },
        error: () => this.toastr.error('Server error during delete'),
      });
  }

  onNew(): void {
    this.selectedBranchNo.set(null);
    this.form.reset({ is_head_office: false, status: 'Active' });
  }
}

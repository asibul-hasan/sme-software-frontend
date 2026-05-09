import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { Sys1002DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';

// ─── Domain Interface ────────────────────────────────────────────────────────

/**
 * Interface representing a Branch entity.
 * Based on the sys_branch table in db.md.
 */
export interface IBranch extends BaseEntity {
  branch_no: number;
  branch_id: string;
  branch_name: string;
  branch_name_nls?: string | null;
  branch_type?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state_province?: string | null;
  post_code?: string | null;
  mobile_number?: string | null;
  phone_number?: string | null;
  email?: string | null;
  manager_no?: number | null;
  company_no: number;
  active_status: number;
  display_sl?: number | null;
  remarks?: string | null;
  description?: string | null;
  row_version?: number | null;
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
  branches            = signal<IBranch[]>([]);
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
        (b.branch_name || '').toLowerCase().includes(term) ||
        (b.branch_id || '').toLowerCase().includes(term),
    );
  });

  // ─── Form ───────────────────────────────────────────────────────────────────
  initForm(): void {
    this.form = this.fb.group({
      branch_no:         [null],
      branch_id:         ['', [Validators.required, Validators.maxLength(50)]],
      branch_name:       ['', [Validators.required, Validators.maxLength(200)]],
      branch_name_nls:   [''],
      branch_type:       [''],
      address1:          [''],
      address2:          [''],
      city:              [''],
      state_province:    [''],
      post_code:         [''],
      mobile_number:     [''],
      phone_number:      [''],
      email:             ['', Validators.email],
      manager_no:        [null],
      company_no:        [null, Validators.required],
      active_status:     [1, Validators.required],
      display_sl:        [null],
      remarks:           [''],
      description:       [''],
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
          if (isSuccess(res) && res.data) {
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

  selectBranch(branch: IBranch, index?: number): void {
    if (index !== undefined) this.lastSelectedBranchIndex = index;
    this.selectedBranchNo.set(branch.branch_no);
    this.isLoading.set(true);

    this.data
      .loadBranchDetail(branch.branch_no)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            const d = res.data as unknown as Record<string, unknown>;
            this.form.patchValue({
              branch_no:         d['branch_no'] ?? d['branchNo'],
              branch_id:         d['branch_id'] ?? d['branchId'],
              branch_name:       d['branch_name'] ?? d['branchName'],
              branch_name_nls:   d['branch_name_nls'] ?? d['branchNameLocal'],
              branch_type:       d['branch_type'] ?? d['branchType'],
              address1:          d['address1'] ?? d['addressLine1'],
              address2:          d['address2'] ?? d['addressLine2'],
              city:              d['city'],
              state_province:    d['state_province'] ?? d['stateProvince'],
              post_code:         d['post_code'] ?? d['postCode'],
              mobile_number:     d['mobile_number'] ?? d['phonePrimary'],
              phone_number:      d['phone_number'],
              email:             d['email'],
              manager_no:        d['manager_no'] ?? d['managerUserNo'],
              company_no:        d['company_no'] ?? d['companyNo'],
              active_status:     d['active_status'] ?? d['status'] ?? 1,
              display_sl:        d['display_sl'] ?? d['displaySl'],
              remarks:           d['remarks'],
              description:       d['description'],
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
    const val     = this.form.getRawValue();
    const isUpdate = !!this.selectedBranchNo();
    const payload  = {
      ...val,
      branch_no:     this.selectedBranchNo(),
      active_status: val.active_status === true ? 1 : (val.active_status === false ? 0 : val.active_status),
    };

    const obs = isUpdate
      ? this.data.updateBranch(payload)
      : this.data.saveBranch(payload);

    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
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
          if (isSuccess(res)) {
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
    this.form.reset({ active_status: 1 });
  }
}

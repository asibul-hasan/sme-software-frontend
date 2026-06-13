import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Hrm1402DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator, SortDirection } from '../../../../../core/utils/paginator';
import { AuthContextService } from '../../../../../core/services/auth-context.service';

export interface Candidate extends BaseEntity {
  candidate_no: number;
  candidate_id: string;
  full_name: string;
  email?: string | null;
  mobile_number: string;
  source?: number | null;
  requisition_no?: number | null;
  application_status: number;
  branch_no?: number | null;
  remarks?: string | null;
  is_active: number;
  row_version: number;
}

export interface RequisitionOption { requisition_no: number; requisition_id: string; }

/** State + form for HRM_1402 – Candidate / Application. */
@Injectable()
export class Hrm1402ModelService {
  private fb      = inject(FormBuilder);
  private data    = inject(Hrm1402DataService);
  private toastr  = inject(ToastrService);
  private authCtx = inject(AuthContextService);

  private get currentBranchNo(): number | null { return this.authCtx.user()?.branch_no ?? null; }

  candidates    = signal<Candidate[]>([]);
  requisitions  = signal<RequisitionOption[]>([]);
  isLoading     = signal(false);
  isSaving      = signal(false);
  searchTerm    = signal('');
  selectedNo    = signal<number | null>(null);
  sortDirection = signal<SortDirection>('');

  reqLabel(no?: number | null): string { return this.requisitions().find((r) => r.requisition_no === no)?.requisition_id ?? ''; }

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filtered = this.candidates()
      .filter((c) => c.full_name.toLowerCase().includes(term) || c.candidate_id.toLowerCase().includes(term));
    if (this.sortDirection() === '') return filtered;
    const sorted = [...filtered].sort((a, b) => b.candidate_no - a.candidate_no);
    return this.sortDirection() === 'desc' ? sorted : [...sorted].reverse();
  });

  pager = makePaginator(this.filtered);

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      candidate_no:       [null],
      candidate_id:       ['', [Validators.required, Validators.maxLength(30)]],
      full_name:          ['', [Validators.required, Validators.maxLength(150)]],
      email:              ['', [Validators.email]],
      mobile_number:      ['', [Validators.required, Validators.maxLength(20)]],
      source:             [1],
      requisition_no:     [null],
      application_status: [1, [Validators.required]],
      remarks:            [''],
      is_active:          [1],
    });
  }

  loadRequisitions(): void {
    this.data.loadRequisitions().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.requisitions.set(r.data); } });
  }

  loadCandidates(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.loadCandidates().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.candidates.set(res.data);
          if (res.data.length > 0) {
            const target = reselectNo != null ? res.data.find((c) => c.candidate_no === reselectNo) : null;
            this.selectCandidate(target ?? res.data[0]);
          } else {
            this.onNew();
          }
        }
      },
      error: () => this.toastr.error('Failed to load candidates'),
    });
  }

  selectCandidate(item: Candidate): void {
    this.selectedNo.set(item.candidate_no);
    this.isLoading.set(true);
    this.data.loadCandidateDetail(item.candidate_no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data as unknown as Record<string, unknown>;
          this.form.patchValue({
            candidate_no:       d['candidate_no'],
            candidate_id:       d['candidate_id'],
            full_name:          d['full_name'],
            email:              d['email'],
            mobile_number:      d['mobile_number'],
            source:             d['source'] ?? 1,
            requisition_no:     d['requisition_no'],
            application_status: d['application_status'] ?? 1,
            remarks:            d['remarks'],
            is_active:          d['is_active'],
          });
        }
      },
      error: () => this.toastr.error('Failed to load candidate details'),
    });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Please correct the errors before saving.');
      return;
    }
    this.isSaving.set(true);
    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedNo();
    const payload = {
      candidate_no:       val.candidate_no,
      candidate_id:       val.candidate_id,
      full_name:          val.full_name,
      email:              val.email,
      mobile_number:      val.mobile_number,
      source:             val.source,
      requisition_no:     val.requisition_no,
      application_status: val.application_status,
      branch_no:          this.currentBranchNo,
      remarks:            val.remarks,
      is_active:          val.is_active,
    };
    const obs = isUpdate ? this.data.updateCandidate(this.selectedNo()!, payload) : this.data.saveCandidate(payload);
    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Candidate updated' : 'Candidate created');
          const savedNo = isUpdate ? this.selectedNo() : (res.data?.candidate_no ?? null);
          this.loadCandidates(savedNo);
        } else {
          this.toastr.error(res.message || 'Save failed');
        }
      },
      error: (err) => this.toastr.error(err?.error?.message || 'Server error during save'),
    });
  }

  onDelete(callback?: () => void): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isLoading.set(true);
    this.data.deleteCandidate(no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success('Candidate deleted');
          this.loadCandidates(null);
          if (callback) callback();
        } else {
          this.toastr.error(res.message || 'Delete failed');
        }
      },
      error: (err) => this.toastr.error(err?.error?.message || 'Server error during delete'),
    });
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.form?.reset({ source: 1, application_status: 1, is_active: 1 });
  }
}

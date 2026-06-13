import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Hrm1404DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator, SortDirection } from '../../../../../core/utils/paginator';
import { AuthContextService } from '../../../../../core/services/auth-context.service';
import { CommonDataService, DesignationLookup } from '../../../../../shared/services/common-data.service';

export interface Offer extends BaseEntity {
  offer_no: number;
  offer_id: string;
  candidate_no: number | null;
  designation_no?: number | null;
  grade_no?: number | null;
  offered_salary: number | null;
  joining_date: string | null;
  status: number;
  onboarded_employee_no?: number | null;
  notes?: string | null;
  branch_no?: number | null;
  is_active: number;
  row_version: number;
}

export interface OfferLetter { offer_no: number; offer_id: string; candidate_name: string; letter_text: string; }
export interface CandidateOption { candidate_no: number; candidate_id: string; full_name: string; }
export interface GradeOption { grade_no: number; grade_id: string; grade_name: string; }

type OfferAction = 'send' | 'accept' | 'decline' | 'revoke';

/** State + form + offer lifecycle for HRM_1404 – Offer & Onboarding. */
@Injectable()
export class Hrm1404ModelService {
  private fb      = inject(FormBuilder);
  private data    = inject(Hrm1404DataService);
  private commApi = inject(CommonDataService);
  private toastr  = inject(ToastrService);
  private authCtx = inject(AuthContextService);

  private get currentBranchNo(): number | null { return this.authCtx.user()?.branch_no ?? null; }

  offers       = signal<Offer[]>([]);
  candidates   = signal<CandidateOption[]>([]);
  designations = signal<DesignationLookup[]>([]);
  grades       = signal<GradeOption[]>([]);
  letter       = signal<OfferLetter | null>(null);
  isLoading    = signal(false);
  isSaving     = signal(false);
  searchTerm   = signal('');
  selectedNo   = signal<number | null>(null);
  status       = signal<number>(1);
  sortDirection = signal<SortDirection>('');

  /** Status: 1=Draft 2=Sent 3=Accepted 4=Declined 5=Expired 6=Revoked. */
  readonly isDraft = computed(() => this.status() === 1);

  candidateName(no?: number | null): string {
    const c = this.candidates().find((x) => x.candidate_no === no);
    return c ? c.full_name : (no != null ? `#${no}` : '');
  }

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filtered = this.offers()
      .filter((o) => (o.offer_id || '').toLowerCase().includes(term) || this.candidateName(o.candidate_no).toLowerCase().includes(term));
    if (this.sortDirection() === '') return filtered;
    const sorted = [...filtered].sort((a, b) => b.offer_no - a.offer_no);
    return this.sortDirection() === 'desc' ? sorted : [...sorted].reverse();
  });

  pager = makePaginator(this.filtered);

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      offer_no:       [null],
      offer_id:       ['', [Validators.required, Validators.maxLength(30)]],
      candidate_no:   [null, [Validators.required]],
      designation_no: [null],
      grade_no:       [null],
      offered_salary: [null, [Validators.required, Validators.min(0)]],
      joining_date:   [null, [Validators.required]],
      notes:          [''],
      is_active:      [1],
    });
  }

  loadLookups(): void {
    this.data.loadOfferableCandidates().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.candidates.set(r.data); } });
    this.commApi.getDesignationList().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.designations.set(r.data); } });
    this.data.loadGrades().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.grades.set(r.data); } });
  }

  loadOffers(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.loadOffers().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.offers.set(res.data);
          if (res.data.length > 0) {
            const target = reselectNo != null ? res.data.find((o) => o.offer_no === reselectNo) : null;
            this.selectOffer(target ?? res.data[0]);
          } else {
            this.onNew();
          }
        }
      },
      error: () => this.toastr.error('Failed to load offers'),
    });
  }

  selectOffer(item: Offer): void {
    this.selectedNo.set(item.offer_no);
    this.status.set(item.status);
    this.letter.set(null);
    this.isLoading.set(true);
    this.data.loadOfferDetail(item.offer_no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data;
          this.status.set(d.status);
          this.form.patchValue({
            offer_no:       d.offer_no,
            offer_id:       d.offer_id,
            candidate_no:   d.candidate_no,
            designation_no: d.designation_no,
            grade_no:       d.grade_no,
            offered_salary: d.offered_salary,
            joining_date:   d.joining_date ? d.joining_date.slice(0, 10) : null,
            notes:          d.notes,
            is_active:      d.is_active,
          });
        }
      },
      error: () => this.toastr.error('Failed to load offer details'),
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
      offer_no:       val.offer_no,
      offer_id:       val.offer_id,
      candidate_no:   val.candidate_no,
      designation_no: val.designation_no,
      grade_no:       val.grade_no,
      offered_salary: val.offered_salary,
      joining_date:   val.joining_date,
      notes:          val.notes,
      branch_no:      this.currentBranchNo,
      is_active:      val.is_active,
    };
    const obs = isUpdate ? this.data.updateOffer(this.selectedNo()!, payload) : this.data.saveOffer(payload);
    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Offer updated' : 'Offer created');
          const savedNo = isUpdate ? this.selectedNo() : (res.data?.offer_no ?? null);
          this.loadOffers(savedNo);
        } else {
          this.toastr.error(res.message || 'Save failed');
        }
      },
      error: (err) => this.toastr.error(err?.error?.message || 'Server error during save'),
    });
  }

  doAction(action: OfferAction): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isSaving.set(true);
    this.data.action(no, action).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          const past: Record<OfferAction, string> = { send: 'sent', accept: 'accepted', decline: 'declined', revoke: 'revoked' };
          this.toastr.success(`Offer ${past[action]}`);
          this.loadOffers(no);
        } else {
          this.toastr.error(res.message || `${action} failed`);
        }
      },
      error: (err) => this.toastr.error(err?.error?.message || `Server error during ${action}`),
    });
  }

  generateLetter(): void {
    const no = this.selectedNo();
    if (!no) return;
    this.data.loadLetter(no).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.letter.set(res.data); else this.toastr.error('Failed to build letter'); },
      error: () => this.toastr.error('Failed to build letter'),
    });
  }

  onDelete(callback?: () => void): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isLoading.set(true);
    this.data.deleteOffer(no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success('Offer deleted');
          this.loadOffers(null);
          if (callback) callback();
        } else {
          this.toastr.error(res.message || 'Delete failed');
        }
      },
      error: () => this.toastr.error('Server error during delete'),
    });
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.status.set(1);
    this.letter.set(null);
    this.form?.reset({ is_active: 1 });
  }
}

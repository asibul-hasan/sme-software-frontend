import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Fin1101DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';

export interface AccountLite { account_no: number; account_code: string; account_name: string; is_postable?: number | null; }
export interface VoucherTypeLite { voucher_type_no: number; type_name: string; base_kind: number; }

export interface VoucherLine {
  voucher_dtl_no?: number | null;
  account_no: number;
  debit: number;
  credit: number;
  cost_center_no?: number | null;
  line_narration?: string | null;
  account_code?: string | null;
  account_name?: string | null;
  __uid?: number;
}

export interface Voucher extends BaseEntity {
  voucher_no: number;
  voucher_id: string;
  voucher_type_no: number | null;
  voucher_date: string | null;
  narration?: string | null;
  reference_no?: string | null;
  total_debit?: number | null;
  total_credit?: number | null;
  status: number;
  base_kind?: number | null;
  voucher_type_name?: string | null;
  is_active: number;
  row_version: number;
  lines?: VoucherLine[];
}

type VoucherAction = 'submit' | 'approve' | 'reject' | 'cancel';

/** State + header form + working line-set for FIN_1101 – Voucher Entry. */
@Injectable()
export class Fin1101ModelService {
  private fb     = inject(FormBuilder);
  private data   = inject(Fin1101DataService);
  private toastr = inject(ToastrService);
  private uidSeq = 1;

  vouchers      = signal<Voucher[]>([]);
  accounts      = signal<AccountLite[]>([]);
  voucherTypes  = signal<VoucherTypeLite[]>([]);
  lines         = signal<VoucherLine[]>([]);
  isLoading     = signal(false);
  isSaving      = signal(false);
  searchTerm    = signal('');
  selectedNo    = signal<number | null>(null);
  status        = signal<number>(1);
  sortDirection = signal<'asc' | 'desc'>('desc');

  readonly isDraft = computed(() => this.status() === 1);

  postableAccounts = computed(() => this.accounts().filter((a) => a.is_postable !== 0));
  accountName = (no?: number | null) => this.accounts().find((a) => a.account_no === no)?.account_name ?? `#${no ?? ''}`;

  totalDebit  = computed(() => this.lines().reduce((s, l) => s + (Number(l.debit) || 0), 0));
  totalCredit = computed(() => this.lines().reduce((s, l) => s + (Number(l.credit) || 0), 0));
  balanced    = computed(() => this.lines().length > 0 && this.totalDebit() > 0 && Math.abs(this.totalDebit() - this.totalCredit()) < 0.005);

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const sorted = this.vouchers()
      .filter((v) => (v.voucher_id || '').toLowerCase().includes(term) || (v.narration || '').toLowerCase().includes(term))
      .sort((a, b) => b.voucher_no - a.voucher_no);
    return this.sortDirection() === 'desc' ? sorted : [...sorted].reverse();
  });
  pager = makePaginator(this.filtered);

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      voucher_no:      [null],
      voucher_type_no: [null, [Validators.required]],
      voucher_date:    [new Date().toISOString().split('T')[0], [Validators.required]],
      reference_no:    [''],
      narration:       [''],
    });
  }

  loadLookups(): void {
    this.data.loadAccounts().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.accounts.set(r.data); } });
    this.data.loadVoucherTypes().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.voucherTypes.set(r.data); } });
  }

  // ── working line set ──────────────────────────────────────────────────────
  addLine(accountNo: number | null, debit: number, credit: number, narration: string | null): boolean {
    if (accountNo == null) { this.toastr.warning('Pick an account'); return false; }
    const dr = Number(debit) || 0, cr = Number(credit) || 0;
    if (dr <= 0 && cr <= 0) { this.toastr.warning('Enter a debit or a credit'); return false; }
    if (dr > 0 && cr > 0) { this.toastr.warning('A line is debit OR credit, not both'); return false; }
    const acc = this.accounts().find((a) => a.account_no === accountNo);
    this.lines.update((arr) => [...arr, {
      account_no: accountNo, debit: dr, credit: cr, line_narration: narration || null,
      account_code: acc?.account_code, account_name: acc?.account_name, __uid: this.uidSeq++,
    }]);
    return true;
  }
  removeLine(uid?: number): void { this.lines.update((arr) => arr.filter((l) => l.__uid !== uid)); }

  load(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.loadVouchers().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.vouchers.set(res.data);
          if (res.data.length > 0) {
            const target = reselectNo != null ? res.data.find((v) => v.voucher_no === reselectNo) : null;
            this.select(target ?? res.data[0]);
          } else { this.onNew(); }
        }
      },
      error: () => this.toastr.error('Failed to load vouchers'),
    });
  }

  select(item: Voucher): void {
    this.selectedNo.set(item.voucher_no);
    this.status.set(item.status);
    this.isLoading.set(true);
    this.data.loadDetail(item.voucher_no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data;
          this.status.set(d.status);
          this.vouchers.update((arr) => arr.map((x) => (x.voucher_no === d.voucher_no ? { ...x, ...d } : x)));
          this.lines.set((d.lines ?? []).map((l) => ({ ...l, __uid: this.uidSeq++ })));
          this.form.patchValue({
            voucher_no:      d.voucher_no,
            voucher_type_no: d.voucher_type_no,
            voucher_date:    d.voucher_date ? d.voucher_date.slice(0, 10) : null,
            reference_no:    d.reference_no,
            narration:       d.narration,
          });
        }
      },
      error: () => this.toastr.error('Failed to load voucher'),
    });
  }

  current = computed(() => this.vouchers().find((v) => v.voucher_no === this.selectedNo()) ?? null);

  onSave(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.toastr.warning('Pick a voucher type and date.'); return; }
    if (this.lines().length < 2) { this.toastr.warning('A voucher needs at least two lines.'); return; }
    if (!this.balanced()) { this.toastr.warning('Out of balance — debit must equal credit.'); return; }
    this.isSaving.set(true);
    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedNo();
    const payload = {
      ...val,
      lines: this.lines().map((l) => ({ account_no: l.account_no, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0, cost_center_no: l.cost_center_no ?? null, line_narration: l.line_narration ?? null })),
    };
    const obs = isUpdate ? this.data.update(this.selectedNo()!, payload) : this.data.save(payload);
    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Voucher updated' : 'Voucher created');
          this.load(isUpdate ? this.selectedNo() : (res.data?.voucher_no ?? null));
        } else { this.toastr.error(res.message || 'Save failed'); }
      },
      error: (err) => this.toastr.error(err?.error?.message || 'Server error during save'),
    });
  }

  doAction(action: VoucherAction): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isSaving.set(true);
    this.data.action(no, action).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          const past: Record<VoucherAction, string> = { submit: 'submitted', approve: 'approved', reject: 'rejected', cancel: 'cancelled' };
          this.toastr.success(`Voucher ${past[action]}`);
          this.load(no);
        } else { this.toastr.error(res.message || `${action} failed`); }
      },
      error: (err) => this.toastr.error(err?.error?.message || `Server error during ${action}`),
    });
  }

  onDelete(): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isLoading.set(true);
    this.data.remove(no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => { if (isSuccess(res)) { this.toastr.success('Voucher deleted'); this.load(null); } else { this.toastr.error(res.message || 'Delete failed'); } },
      error: (err) => this.toastr.error(err?.error?.message || 'Server error during delete'),
    });
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.status.set(1);
    this.lines.set([]);
    this.form?.reset({ voucher_date: new Date().toISOString().split('T')[0] });
  }
}

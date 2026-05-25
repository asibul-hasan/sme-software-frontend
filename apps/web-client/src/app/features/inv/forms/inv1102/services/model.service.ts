import { Injectable, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';
import { resolvePostReloadSelection } from '../../../../../core/utils/list-selection.utils';
import { Inv1102DataService } from './data.service';

export interface Lookup { value: number; label: string; }
export interface Lookups { warehouses: Lookup[]; products: Lookup[]; uoms: Lookup[]; }

export interface IAdjustment {
  adjustment_no: number;
  adjustment_id: string;
  adjustment_date: string;
  warehouse_no: number;
  warehouse_name?: string | null;
  adjustment_type: number;
  reason_text?: string | null;
  status: number;
  total_in_value?: number | null;
  total_out_value?: number | null;
  remarks?: string | null;
  row_version?: number;
  lines?: unknown[];
}

@Injectable()
export class Inv1102ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Inv1102DataService);
  private toastr = inject(ToastrService);

  items = signal<IAdjustment[]>([]);
  lookups = signal<Lookups>({ warehouses: [], products: [], uoms: [] });
  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');
  selectedNo = signal<number | null>(null);
  status = signal<number>(1);
  form!: FormGroup;

  readonly adjustmentTypes = [
    { value: 1, label: 'Correction' },
    { value: 3, label: 'Damage' },
    { value: 4, label: 'Loss / Theft' },
    { value: 5, label: 'Count Variance' },
    { value: 6, label: 'Revaluation' },
  ];
  readonly directions = [
    { value: 1, label: 'Increase' },
    { value: -1, label: 'Decrease' },
  ];

  isDraft = computed(() => this.status() === 1);
  isSubmitted = computed(() => this.status() === 2);
  isPosted = computed(() => this.status() === 3);
  isCancelled = computed(() => this.status() === 4);
  isLocked = computed(() => this.status() >= 2);

  statusLabel = computed(() => ({ 1: 'Draft', 2: 'Submitted', 3: 'Posted', 4: 'Cancelled' } as Record<number, string>)[this.status()] || 'Draft');

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const data = this.items();
    if (!term) return data;
    return data.filter((o) => (o.adjustment_id || '').toLowerCase().includes(term));
  });

  pager = makePaginator<IAdjustment>(this.filtered);

  get lines(): FormArray { return this.form.get('lines') as FormArray; }

  initForm(): void {
    this.form = this.fb.group({
      adjustment_no: [null],
      adjustment_id: [{ value: '', disabled: true }],
      adjustment_date: [new Date().toISOString().substring(0, 10), [Validators.required]],
      warehouse_no: [null, [Validators.required]],
      adjustment_type: [1, [Validators.required]],
      reason_text: [''],
      remarks: [''],
      lines: this.fb.array([]),
    });
  }

  private lineGroup(l?: any): FormGroup {
    return this.fb.group({
      adjustment_dtl_no: [l?.adjustment_dtl_no ?? null],
      product_no: [l?.product_no ?? null, [Validators.required]],
      uom_no: [l?.uom_no ?? null, [Validators.required]],
      direction: [l?.direction ?? 1, [Validators.required]],
      qty: [l?.qty ?? null, [Validators.required, Validators.min(0.0001)]],
      unit_cost: [l?.unit_cost ?? 0],
      batch_code: [l?.batch_code ?? ''],
      expiry_date: [l?.expiry_date ?? null],
      remarks: [l?.remarks ?? ''],
    });
  }

  loadLookups(): void {
    this.data.getLookups().subscribe((res) => { if (isSuccess(res) && res.data) this.lookups.set(res.data); });
  }

  loadList(reselectNo: number | null = null): void {
    this.isLoading.set(true);
    this.data.getList().pipe(finalize(() => this.isLoading.set(false))).subscribe((res) => {
      if (isSuccess(res) && res.data) {
        this.items.set(res.data);
        const resolved = resolvePostReloadSelection(res.data, (o: IAdjustment) => o.adjustment_no, reselectNo);
        resolved ? this.select(resolved.item as IAdjustment) : this.onNew();
      }
    });
  }

  select(item: IAdjustment): void {
    this.selectedNo.set(item.adjustment_no);
    this.isLoading.set(true);
    this.data.getDetail(item.adjustment_no).pipe(finalize(() => this.isLoading.set(false))).subscribe((res) => {
      if (isSuccess(res) && res.data) this.patch(res.data);
    });
  }

  private patch(o: any): void {
    this.status.set(o.status ?? 1);
    this.lines.clear();
    (o.lines || []).forEach((l: any) => this.lines.push(this.lineGroup(l)));
    this.form.patchValue({
      adjustment_no: o.adjustment_no, adjustment_id: o.adjustment_id, adjustment_date: o.adjustment_date,
      warehouse_no: o.warehouse_no, adjustment_type: o.adjustment_type, reason_text: o.reason_text ?? '', remarks: o.remarks ?? '',
    });
    if (this.isLocked()) this.form.disable({ emitEvent: false });
    else this.form.enable({ emitEvent: false });
    this.form.get('adjustment_id')?.disable({ emitEvent: false });
  }

  addLine(): void { if (this.isDraft()) this.lines.push(this.lineGroup()); }
  removeLine(i: number): void { if (this.isDraft()) this.lines.removeAt(i); }

  lineValue(i: number): number {
    const g = this.lines.at(i);
    return (Number(g.get('qty')?.value) || 0) * (Number(g.get('unit_cost')?.value) || 0);
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.status.set(1);
    this.lines.clear();
    this.form.enable({ emitEvent: false });
    this.form.reset({ adjustment_date: new Date().toISOString().substring(0, 10), adjustment_type: 1 });
    this.form.get('adjustment_id')?.disable({ emitEvent: false });
  }

  onSaveDraft(): void {
    if (!this.isDraft()) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); this.toastr.warning('Please correct the validation errors.'); return; }
    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedNo();
    this.isSaving.set(true);
    this.data.save({ ...val, adjustment_no: this.selectedNo() }).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) { this.toastr.success(isUpdate ? 'Draft updated' : 'Draft created'); this.loadList(res.data?.adjustment_no ?? this.selectedNo()); }
        else this.toastr.error(res.message || 'Save failed');
      },
      error: (err) => this.toastr.error(err?.error?.message || 'API error during save'),
    });
  }

  private action(fn: (no: number) => any, okMsg: string): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isSaving.set(true);
    fn(no).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res: any) => { if (isSuccess(res)) { this.toastr.success(okMsg); this.loadList(no); } else this.toastr.error(res.message || 'Action failed'); },
      error: (err: any) => this.toastr.error(err?.error?.message || 'API error'),
    });
  }

  onSubmit(): void { this.action((no) => this.data.submit(no), 'Submitted'); }
  onApprove(): void { this.action((no) => this.data.approve(no), 'Approved & posted'); }
  onCancel(): void { this.action((no) => this.data.cancel(no), 'Cancelled (reversed)'); }

  onDelete(): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isLoading.set(true);
    this.data.delete(no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => { if (isSuccess(res)) { this.toastr.success('Draft deleted'); this.loadList(); } else this.toastr.error(res.message || 'Delete failed'); },
      error: (err) => this.toastr.error(err?.error?.message || 'API error during delete'),
    });
  }
}

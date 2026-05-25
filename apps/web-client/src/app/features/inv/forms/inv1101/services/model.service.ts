import { Injectable, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';
import { resolvePostReloadSelection } from '../../../../../core/utils/list-selection.utils';
import { Inv1101DataService } from './data.service';

export interface Lookup { value: number; label: string; }
export interface Lookups { warehouses: Lookup[]; products: Lookup[]; uoms: Lookup[]; }

export interface IOpening {
  adjustment_no: number;
  adjustment_id: string;
  adjustment_date: string;
  warehouse_no: number;
  warehouse_name?: string | null;
  status: number;
  reason_text?: string | null;
  remarks?: string | null;
  total_in_value?: number | null;
  fin_year_no?: number | null;
  row_version?: number;
  lines?: unknown[];
}

@Injectable()
export class Inv1101ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Inv1101DataService);
  private toastr = inject(ToastrService);

  items = signal<IOpening[]>([]);
  lookups = signal<Lookups>({ warehouses: [], products: [], uoms: [] });
  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');
  selectedNo = signal<number | null>(null);
  status = signal<number>(1);
  form!: FormGroup;

  isPosted = computed(() => this.status() === 3);

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const data = this.items();
    if (!term) return data;
    return data.filter((o) => (o.adjustment_id || '').toLowerCase().includes(term));
  });

  pager = makePaginator<IOpening>(this.filtered);

  get lines(): FormArray { return this.form.get('lines') as FormArray; }

  initForm(): void {
    this.form = this.fb.group({
      adjustment_no: [null],
      adjustment_id: [{ value: '', disabled: true }],
      adjustment_date: [new Date().toISOString().substring(0, 10), [Validators.required]],
      warehouse_no: [null, [Validators.required]],
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
      qty: [l?.qty ?? null, [Validators.required, Validators.min(0.0001)]],
      unit_cost: [l?.unit_cost ?? 0],
      batch_code: [l?.batch_code ?? ''],
      mfg_date: [l?.mfg_date ?? null],
      expiry_date: [l?.expiry_date ?? null],
      remarks: [l?.remarks ?? ''],
    });
  }

  loadLookups(): void {
    this.data.getLookups().subscribe((res) => {
      if (isSuccess(res) && res.data) this.lookups.set(res.data);
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
          const resolved = resolvePostReloadSelection(res.data, (o: IOpening) => o.adjustment_no, reselectNo);
          resolved ? this.select(resolved.item as IOpening) : this.onNew();
        }
      });
  }

  select(item: IOpening): void {
    this.selectedNo.set(item.adjustment_no);
    this.isLoading.set(true);
    this.data
      .getDetail(item.adjustment_no)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) this.patch(res.data);
      });
  }

  private patch(o: any): void {
    this.status.set(o.status ?? 1);
    this.lines.clear();
    (o.lines || []).forEach((l: any) => this.lines.push(this.lineGroup(l)));
    this.form.patchValue({
      adjustment_no: o.adjustment_no,
      adjustment_id: o.adjustment_id,
      adjustment_date: o.adjustment_date,
      warehouse_no: o.warehouse_no,
      reason_text: o.reason_text ?? '',
      remarks: o.remarks ?? '',
    });
    if (o.status === 3) this.form.disable({ emitEvent: false });
    else this.form.enable({ emitEvent: false });
    this.form.get('adjustment_id')?.disable({ emitEvent: false });
  }

  addLine(): void { if (!this.isPosted()) this.lines.push(this.lineGroup()); }
  removeLine(i: number): void { if (!this.isPosted()) this.lines.removeAt(i); }

  lineValue(i: number): number {
    const g = this.lines.at(i);
    const qty = Number(g.get('qty')?.value) || 0;
    const cost = Number(g.get('unit_cost')?.value) || 0;
    return qty * cost;
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.status.set(1);
    this.lines.clear();
    this.form.enable({ emitEvent: false });
    this.form.reset({ adjustment_date: new Date().toISOString().substring(0, 10) });
    this.form.get('adjustment_id')?.disable({ emitEvent: false });
  }

  onSaveDraft(): void {
    if (this.isPosted()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Please correct the validation errors.');
      return;
    }
    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedNo();
    this.isSaving.set(true);
    this.data
      .save({ ...val, adjustment_no: this.selectedNo() })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success(isUpdate ? 'Draft updated' : 'Draft created');
            this.loadList(res.data?.adjustment_no ?? this.selectedNo());
          } else { this.toastr.error(res.message || 'Save failed'); }
        },
        error: (err) => this.toastr.error(err?.error?.message || 'API error during save'),
      });
  }

  onPost(): void {
    const no = this.selectedNo();
    if (!no || this.isPosted()) return;
    this.isSaving.set(true);
    this.data
      .post(no)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) { this.toastr.success('Opening stock posted'); this.loadList(no); }
          else this.toastr.error(res.message || 'Post failed');
        },
        error: (err) => this.toastr.error(err?.error?.message || 'API error during post'),
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
          if (isSuccess(res)) { this.toastr.success('Draft deleted'); this.loadList(); }
          else this.toastr.error(res.message || 'Delete failed');
        },
        error: (err) => this.toastr.error(err?.error?.message || 'API error during delete'),
      });
  }
}

import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';
import { resolvePostReloadSelection } from '../../../../../core/utils/list-selection.utils';
import { Inv1102DataService } from './data.service';
import { invConstants } from '../../../constants/inv.constants';

export interface Lookup { value: number; label: string; }
export interface Lookups { warehouses: Lookup[]; products: Lookup[]; uoms: Lookup[]; }

export interface IAdjustmentLine {
  __uid?: number;
  adjustment_dtl_no?: number | null;
  product_no: number | null;
  product_name?: string | null;
  variant_no?: number | null;
  uom_no: number | null;
  uom_name?: string | null;
  direction: number;
  qty: number;
  unit_cost: number;
  batch_no?: number | null;
  batch_code?: string | null;
  expiry_date?: string | null;
  __total?: number;
  row_version?: number;
}

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
  row_version?: number;
  lines?: IAdjustmentLine[];
}

@Injectable()
export class Inv1102ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Inv1102DataService);
  private toastr = inject(ToastrService);
  private uid = 0;

  items = signal<IAdjustment[]>([]);
  lookups = signal<Lookups>({ warehouses: [], products: [], uoms: [] });
  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');
  selectedNo = signal<number | null>(null);
  status = signal(1);
  form!: FormGroup;

  lineRows = signal<IAdjustmentLine[]>([]);

  readonly adjustmentTypes = invConstants.adjustmentTypes;
  readonly directions = [{ value: 1, label: 'In (+)' }, { value: 2, label: 'Out (-)' }];

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const data = this.items();
    const list = term
      ? data.filter(
          (o) =>
            (o.adjustment_id || '').toLowerCase().includes(term) ||
            (o.warehouse_name || '').toLowerCase().includes(term) ||
            (o.reason_text || '').toLowerCase().includes(term),
        )
      : data;
    return [...list].sort((a, b) => (b.adjustment_no ?? 0) - (a.adjustment_no ?? 0));
  });

  pager = makePaginator<IAdjustment>(this.filtered);

  readonly isDraft = computed(() => this.status() === 1);
  readonly isSubmitted = computed(() => this.status() === 2);
  readonly isPosted = computed(() => this.status() === 3);

  readonly totalInValue = computed(() =>
    this.lineRows()
      .filter((l) => Number(l.direction) === 1)
      .reduce((sum, l) => sum + (Number(l.qty) || 0) * (Number(l.unit_cost) || 0), 0),
  );

  readonly totalOutValue = computed(() =>
    this.lineRows()
      .filter((l) => Number(l.direction) === 2)
      .reduce((sum, l) => sum + (Number(l.qty) || 0) * (Number(l.unit_cost) || 0), 0),
  );

  readonly netValue = computed(() => this.totalInValue() - this.totalOutValue());

  readonly statusLabel = computed(
    () => ({ 1: 'Draft', 2: 'Submitted', 3: 'Posted', 4: 'Cancelled' } as Record<number, string>)[this.status()] || 'Draft',
  );

  readonly lineData = computed(() =>
    this.lineRows().map((l) => ({
      ...l,
      __total: (Number(l.direction) === 2 ? -1 : 1) * (Number(l.qty) || 0) * (Number(l.unit_cost) || 0),
    })),
  );

  initForm(): void {
    this.form = this.fb.group({
      adjustment_no: [null],
      adjustment_id: [{ value: '', disabled: true }],
      adjustment_date: [new Date().toISOString().substring(0, 10), [Validators.required]],
      warehouse_no: [null, [Validators.required]],
      adjustment_type: [1, [Validators.required]],
      reason_text: [''],
      remarks: [''],
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
        if (resolved) {
          this.select(resolved.item as IAdjustment);
        } else {
          this.onNew();
        }
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
    const lines: IAdjustmentLine[] = (o.lines || []).map((l: any) => ({ ...l, __uid: ++this.uid }));
    this.lineRows.set(lines);
    this.form.patchValue({
      adjustment_no: o.adjustment_no, adjustment_id: o.adjustment_id, adjustment_date: o.adjustment_date,
      warehouse_no: o.warehouse_no, adjustment_type: o.adjustment_type ?? 1,
      reason_text: o.reason_text ?? '', remarks: o.remarks ?? '',
    });
    if (o.status === 1) this.form.enable({ emitEvent: false });
    else this.form.disable({ emitEvent: false });
    this.form.get('adjustment_id')?.disable({ emitEvent: false });
  }

  addLine(): void {
    this.lineRows.update((rows) => [
      ...rows,
      {
        __uid: ++this.uid,
        product_no: null,
        uom_no: null,
        direction: 1,
        qty: 1,
        unit_cost: 0,
        batch_code: '',
        expiry_date: null,
      },
    ]);
  }

  onLineChange(row: IAdjustmentLine): void {
    this.lineRows.update((rows) =>
      rows.map((r) => {
        if (r.__uid !== row.__uid) return r;
        const updated = { ...r, ...row };
        if (row.product_no && row.product_no !== r.product_no) {
          const p = this.lookups().products.find((x) => x.value === row.product_no);
          if (p) {
            updated.product_name = p.label;
            const uom = this.lookups().uoms[0];
            if (uom && !updated.uom_no) updated.uom_no = uom.value;
          }
        }
        return updated;
      }),
    );
  }

  removeLine(row: IAdjustmentLine): void {
    this.lineRows.update((rows) => rows.filter((r) => r.__uid !== row.__uid));
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.status.set(1);
    this.lineRows.set([]);
    this.form.enable({ emitEvent: false });
    this.form.reset({ adjustment_date: new Date().toISOString().substring(0, 10), adjustment_type: 1 });
    this.form.get('adjustment_id')?.disable({ emitEvent: false });
  }

  onSaveDraft(): void {
    if (!this.isDraft()) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); this.toastr.warning('Please correct the validation errors.'); return; }
    if (this.lineRows().length === 0) { this.toastr.warning('Please add at least one line item.'); return; }
    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedNo();
    this.isSaving.set(true);
    const payload = {
      ...val,
      adjustment_no: this.selectedNo(),
      lines: this.lineRows().map(({ __uid: _uid, __total: _tot, ...rest }) => rest),
    };
    this.data.save(payload).pipe(finalize(() => this.isSaving.set(false))).subscribe({
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

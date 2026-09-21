import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';
import { resolvePostReloadSelection } from '../../../../../core/utils/list-selection.utils';
import { Inv1101DataService } from './data.service';

export interface Lookup { value: number; label: string; }
export interface Lookups { warehouses: Lookup[]; products: Lookup[]; uoms: Lookup[]; }

export interface IOpeningLine {
  __uid?: number;
  adjustment_dtl_no?: number | null;
  product_no: number | null;
  product_name?: string | null;
  variant_no?: number | null;
  uom_no: number | null;
  uom_name?: string | null;
  qty: number;
  unit_cost: number;
  batch_no?: number | null;
  batch_code?: string | null;
  expiry_date?: string | null;
  __total?: number;
  row_version?: number;
}

export interface IOpening {
  adjustment_no: number;
  adjustment_id: string;
  adjustment_date: string;
  warehouse_no: number;
  warehouse_name?: string | null;
  reason_text?: string | null;
  status: number;
  total_in_value?: number | null;
  row_version?: number;
  lines?: IOpeningLine[];
}

@Injectable()
export class Inv1101ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Inv1101DataService);
  private toastr = inject(ToastrService);
  private uid = 0;

  items = signal<IOpening[]>([]);
  lookups = signal<Lookups>({ warehouses: [], products: [], uoms: [] });
  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');
  selectedNo = signal<number | null>(null);
  status = signal(1); // 1 = Draft, 3 = Posted
  form!: FormGroup;

  lineRows = signal<IOpeningLine[]>([]);

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

  pager = makePaginator<IOpening>(this.filtered);

  readonly isPosted = computed(() => this.status() === 3);

  readonly totalValue = computed(() =>
    this.lineRows().reduce((sum, l) => sum + (Number(l.qty) || 0) * (Number(l.unit_cost) || 0), 0),
  );

  readonly lineData = computed(() =>
    this.lineRows().map((l) => ({
      ...l,
      __total: (Number(l.qty) || 0) * (Number(l.unit_cost) || 0),
    })),
  );

  initForm(): void {
    this.form = this.fb.group({
      adjustment_no: [null],
      adjustment_id: [{ value: '', disabled: true }],
      adjustment_date: [new Date().toISOString().substring(0, 10), [Validators.required]],
      warehouse_no: [null, [Validators.required]],
      reason_text: [''],
      remarks: [''],
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
          if (resolved) {
            this.select(resolved.item as IOpening);
          } else {
            this.onNew();
          }
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
    const lines: IOpeningLine[] = (o.lines || []).map((l: any) => ({ ...l, __uid: ++this.uid }));
    this.lineRows.set(lines);
    this.form.patchValue({
      adjustment_no: o.adjustment_no,
      adjustment_id: o.adjustment_id,
      adjustment_date: o.adjustment_date,
      warehouse_no: o.warehouse_no,
      reason_text: o.reason_text ?? '',
      remarks: o.remarks ?? '',
    });
    if (o.status === 3) {
      this.form.disable({ emitEvent: false });
    } else {
      this.form.enable({ emitEvent: false });
    }
    this.form.get('adjustment_id')?.disable({ emitEvent: false });
  }

  addLine(): void {
    this.lineRows.update((rows) => [
      ...rows,
      {
        __uid: ++this.uid,
        product_no: null,
        uom_no: null,
        qty: 1,
        unit_cost: 0,
        batch_code: '',
        expiry_date: null,
      },
    ]);
  }

  removeLine(row: IOpeningLine): void {
    this.lineRows.update((rows) => rows.filter((r) => r.__uid !== row.__uid));
  }

  onLineChange(row: IOpeningLine): void {
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

  onNew(): void {
    this.selectedNo.set(null);
    this.status.set(1);
    this.lineRows.set([]);
    this.form.enable({ emitEvent: false });
    this.form.reset({ adjustment_date: new Date().toISOString().substring(0, 10) });
    this.form.get('adjustment_id')?.disable({ emitEvent: false });
  }

  onSaveDraft(): void {
    if (this.isPosted()) {
      this.toastr.warning('Posted documents cannot be modified.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Please correct the validation errors.');
      return;
    }
    if (this.lineRows().length === 0) {
      this.toastr.warning('Please add at least one line item.');
      return;
    }
    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedNo();
    this.isSaving.set(true);
    const payload = {
      ...val,
      adjustment_no: this.selectedNo(),
      lines: this.lineRows().map(({ __uid: _uid, __total: _tot, ...rest }) => rest),
    };
    this.data
      .save(payload)
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

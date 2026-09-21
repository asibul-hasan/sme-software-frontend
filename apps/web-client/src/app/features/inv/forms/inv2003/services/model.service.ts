import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';
import { resolvePostReloadSelection } from '../../../../../core/utils/list-selection.utils';
import { Inv2003DataService } from './data.service';
import { invConstants } from '../../../constants/inv.constants';

export interface Lookup { value: number; label: string; }
export interface Lookups { warehouses: Lookup[]; products: Lookup[]; uoms: Lookup[]; }

export interface ITransferLine {
  __uid?: number;
  transfer_dtl_no?: number | null;
  product_no: number | null;
  product_name?: string | null;
  variant_no?: number | null;
  uom_no: number | null;
  uom_name?: string | null;
  qty_sent: number;
  qty_received?: number | null;
  unit_cost?: number;
  batch_no?: number | null;
  batch_code?: string | null;
  expiry_date?: string | null;
  row_version?: number;
}

export interface ITransfer {
  transfer_no: number;
  transfer_id: string;
  transfer_date: string;
  from_warehouse_no: number;
  from_warehouse_name?: string | null;
  to_warehouse_no: number;
  to_warehouse_name?: string | null;
  status: number; // 1=Draft, 2=Submitted, 3=Dispatched, 4=Received, 5=Partially, 6=Cancelled
  row_version?: number;
  lines?: ITransferLine[];
}

@Injectable()
export class Inv2003ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Inv2003DataService);
  private toastr = inject(ToastrService);
  private uid = 0;

  items = signal<ITransfer[]>([]);
  lookups = signal<Lookups>({ warehouses: [], products: [], uoms: [] });
  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');
  selectedNo = signal<number | null>(null);
  status = signal(1);
  form!: FormGroup;

  lineRows = signal<ITransferLine[]>([]);

  readonly statusLabels = invConstants.stockTransferStatuses;

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const data = this.items();
    const list = term
      ? data.filter(
          (o) =>
            (o.transfer_id || '').toLowerCase().includes(term) ||
            (o.from_warehouse_name || '').toLowerCase().includes(term) ||
            (o.to_warehouse_name || '').toLowerCase().includes(term),
        )
      : data;
    return [...list].sort((a, b) => (b.transfer_no ?? 0) - (a.transfer_no ?? 0));
  });

  pager = makePaginator<ITransfer>(this.filtered);

  readonly isDraft = computed(() => this.status() === 1);
  readonly isSubmitted = computed(() => this.status() === 2);
  readonly isDispatched = computed(() => this.status() === 3);
  readonly isReceived = computed(() => this.status() === 4);
  readonly isClosed = computed(() => this.status() >= 3);
  readonly statusLabel = computed(() => this.statusLabels[this.status()] || 'Draft');

  readonly totalSentQty = computed(() =>
    this.lineRows().reduce((sum, l) => sum + (Number(l.qty_sent) || 0), 0),
  );

  readonly totalReceivedQty = computed(() =>
    this.lineRows().reduce((sum, l) => sum + (Number(l.qty_received) || 0), 0),
  );

  initForm(): void {
    this.form = this.fb.group({
      transfer_no: [null],
      transfer_id: [{ value: '', disabled: true }],
      transfer_date: [new Date().toISOString().substring(0, 10), [Validators.required]],
      from_warehouse_no: [null, [Validators.required]],
      to_warehouse_no: [null, [Validators.required]],
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
        const resolved = resolvePostReloadSelection(res.data, (o: ITransfer) => o.transfer_no, reselectNo);
        if (resolved) {
          this.select(resolved.item as ITransfer);
        } else {
          this.onNew();
        }
      }
    });
  }

  select(item: ITransfer): void {
    this.selectedNo.set(item.transfer_no);
    this.isLoading.set(true);
    this.data.getDetail(item.transfer_no).pipe(finalize(() => this.isLoading.set(false))).subscribe((res) => {
      if (isSuccess(res) && res.data) this.patch(res.data);
    });
  }

  private patch(o: any): void {
    this.status.set(o.status ?? 1);
    const lines: ITransferLine[] = (o.lines || []).map((l: any) => ({ ...l, __uid: ++this.uid }));
    this.lineRows.set(lines);
    this.form.patchValue({
      transfer_no: o.transfer_no, transfer_id: o.transfer_id, transfer_date: o.transfer_date,
      from_warehouse_no: o.from_warehouse_no, to_warehouse_no: o.to_warehouse_no, remarks: o.remarks ?? '',
    });
    if (o.status === 1) this.form.enable({ emitEvent: false });
    else this.form.disable({ emitEvent: false });
    this.form.get('transfer_id')?.disable({ emitEvent: false });
  }

  addLine(): void {
    this.lineRows.update((rows) => [
      ...rows,
      {
        __uid: ++this.uid,
        product_no: null,
        uom_no: null,
        qty_sent: 1,
        qty_received: 0,
        batch_code: '',
        expiry_date: null,
      },
    ]);
  }

  onLineChange(row: ITransferLine): void {
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

  removeLine(row: ITransferLine): void {
    this.lineRows.update((rows) => rows.filter((r) => r.__uid !== row.__uid));
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.status.set(1);
    this.lineRows.set([]);
    this.form.enable({ emitEvent: false });
    this.form.reset({ transfer_date: new Date().toISOString().substring(0, 10) });
    this.form.get('transfer_id')?.disable({ emitEvent: false });
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
      transfer_no: this.selectedNo(),
      lines: this.lineRows().map(({ __uid: _uid, ...rest }) => rest),
    };
    this.data.save(payload).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) { this.toastr.success(isUpdate ? 'Draft updated' : 'Draft created'); this.loadList(res.data?.transfer_no ?? this.selectedNo()); }
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
  onDispatch(): void { this.action((no) => this.data.dispatch(no), 'Dispatched to transit'); }
  onCancel(): void { this.action((no) => this.data.cancel(no), 'Cancelled'); }

  onReceive(): void {
    const no = this.selectedNo();
    if (!no) return;
    const payload = {
      lines: this.lineRows().map((l) => ({
        transfer_dtl_no: l.transfer_dtl_no,
        qty_received: l.qty_received != null ? l.qty_received : l.qty_sent,
      })),
    };
    this.isSaving.set(true);
    this.data.receive(no, payload as any).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => { if (isSuccess(res)) { this.toastr.success('Transfer received'); this.loadList(no); } else this.toastr.error(res.message || 'Receive failed'); },
      error: (err) => this.toastr.error(err?.error?.message || 'API error during receive'),
    });
  }

  onDelete(): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isLoading.set(true);
    this.data.delete(no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => { if (isSuccess(res)) { this.toastr.success('Transfer deleted'); this.loadList(); } else this.toastr.error(res.message || 'Delete failed'); },
      error: (err) => this.toastr.error(err?.error?.message || 'API error during delete'),
    });
  }
}

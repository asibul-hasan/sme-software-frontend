import { Injectable, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';
import { resolvePostReloadSelection } from '../../../../../core/utils/list-selection.utils';
import { Inv2003DataService } from './data.service';

export interface Lookup { value: number; label: string; }
export interface Lookups { warehouses: Lookup[]; products: Lookup[]; uoms: Lookup[]; }

export interface ITransfer {
  transfer_no: number;
  transfer_id: string;
  transfer_date: string;
  from_warehouse_no: number;
  from_warehouse_name?: string | null;
  to_warehouse_no: number;
  to_warehouse_name?: string | null;
  status: number;
  total_qty?: number | null;
  total_value?: number | null;
  remarks?: string | null;
  row_version?: number;
  lines?: unknown[];
}

@Injectable()
export class Inv2003ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Inv2003DataService);
  private toastr = inject(ToastrService);

  items = signal<ITransfer[]>([]);
  lookups = signal<Lookups>({ warehouses: [], products: [], uoms: [] });
  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');
  selectedNo = signal<number | null>(null);
  status = signal<number>(1);
  form!: FormGroup;

  readonly statusLabels: Record<number, string> = { 1: 'Draft', 2: 'Submitted', 3: 'Dispatched', 4: 'Received', 5: 'Short Received', 6: 'Cancelled' };

  isDraft = computed(() => this.status() === 1);
  isSubmitted = computed(() => this.status() === 2);
  isDispatched = computed(() => this.status() === 3);
  isClosed = computed(() => this.status() >= 4);
  statusLabel = computed(() => this.statusLabels[this.status()] || 'Draft');

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const data = this.items();
    if (!term) return data;
    return data.filter((o) => (o.transfer_id || '').toLowerCase().includes(term));
  });

  pager = makePaginator<ITransfer>(this.filtered);

  get lines(): FormArray { return this.form.get('lines') as FormArray; }

  initForm(): void {
    this.form = this.fb.group({
      transfer_no: [null],
      transfer_id: [{ value: '', disabled: true }],
      transfer_date: [new Date().toISOString().substring(0, 10), [Validators.required]],
      from_warehouse_no: [null, [Validators.required]],
      to_warehouse_no: [null, [Validators.required]],
      remarks: [''],
      lines: this.fb.array([]),
    });
  }

  private lineGroup(l?: any): FormGroup {
    return this.fb.group({
      transfer_dtl_no: [l?.transfer_dtl_no ?? null],
      product_no: [l?.product_no ?? null, [Validators.required]],
      uom_no: [l?.uom_no ?? null, [Validators.required]],
      qty_sent: [l?.qty_sent ?? null, [Validators.required, Validators.min(0.0001)]],
      qty_received: [l?.qty_received ?? null],
      batch_code: [l?.batch_code ?? ''],
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
        const resolved = resolvePostReloadSelection(res.data, (o: ITransfer) => o.transfer_no, reselectNo);
        resolved ? this.select(resolved.item as ITransfer) : this.onNew();
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
    this.lines.clear();
    (o.lines || []).forEach((l: any) => this.lines.push(this.lineGroup(l)));
    this.form.patchValue({
      transfer_no: o.transfer_no, transfer_id: o.transfer_id, transfer_date: o.transfer_date,
      from_warehouse_no: o.from_warehouse_no, to_warehouse_no: o.to_warehouse_no, remarks: o.remarks ?? '',
    });
    // Header editable only in Draft; lines' qty_received editable only when Dispatched.
    if (this.isDraft()) this.form.enable({ emitEvent: false });
    else this.form.disable({ emitEvent: false });
    this.form.get('transfer_id')?.disable({ emitEvent: false });
    if (this.isDispatched()) {
      this.lines.controls.forEach((g) => g.get('qty_received')?.enable({ emitEvent: false }));
    }
  }

  addLine(): void { if (this.isDraft()) this.lines.push(this.lineGroup()); }
  removeLine(i: number): void { if (this.isDraft()) this.lines.removeAt(i); }

  onNew(): void {
    this.selectedNo.set(null);
    this.status.set(1);
    this.lines.clear();
    this.form.enable({ emitEvent: false });
    this.form.reset({ transfer_date: new Date().toISOString().substring(0, 10) });
    this.form.get('transfer_id')?.disable({ emitEvent: false });
  }

  onSaveDraft(): void {
    if (!this.isDraft()) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); this.toastr.warning('Please correct the validation errors.'); return; }
    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedNo();
    this.isSaving.set(true);
    this.data.save({ ...val, transfer_no: this.selectedNo() }).pipe(finalize(() => this.isSaving.set(false))).subscribe({
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
      lines: this.lines.getRawValue().map((l: any) => ({
        transfer_dtl_no: l.transfer_dtl_no,
        qty_received: l.qty_received != null && l.qty_received !== '' ? l.qty_received : l.qty_sent,
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
      next: (res) => { if (isSuccess(res)) { this.toastr.success('Draft deleted'); this.loadList(); } else this.toastr.error(res.message || 'Delete failed'); },
      error: (err) => this.toastr.error(err?.error?.message || 'API error during delete'),
    });
  }
}

import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { ITerminal, SalOption, Sal1005DataService } from './data.service';

/**
 * SAL_1005 POS Terminal Setup.
 *
 * A terminal is the bridge between a physical till and the ledger: it names the
 * warehouse its sales relieve and the account its drawer cash lands in. Nothing
 * can be sold until one exists, which is why this is the first POS screen to set up.
 */
@Injectable()
export class Sal1005ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Sal1005DataService);
  private toastr = inject(ToastrService);

  items = signal<ITerminal[]>([]);
  warehouses = signal<SalOption[]>([]);
  selectedNo = signal<number | null>(null);
  searchTerm = signal('');
  isLoading = signal(false);
  isSaving = signal(false);

  form!: FormGroup;

  readonly filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const rows = this.items();
    if (!term) return rows;
    return rows.filter(
      (t) => (t.terminal_id || '').toLowerCase().includes(term)
          || (t.terminal_name || '').toLowerCase().includes(term));
  });

  initForm(): void {
    this.form = this.fb.group({
      terminal_no: [null],
      terminal_id: ['', [Validators.required, Validators.maxLength(30)]],
      terminal_name: ['', [Validators.required, Validators.maxLength(100)]],
      warehouse_no: [null, [Validators.required]],
      device_uuid: [''],
      receipt_prefix: [''],
      cash_gl_account_no: [null],
      remarks: [''],
      is_active: [1],
    });
  }

  loadLookups(): void {
    this.data.lookups().subscribe((res) => {
      if (isSuccess(res) && res.data) this.warehouses.set(res.data.warehouses ?? []);
    });
  }

  loadList(reselect: number | null = null): void {
    this.isLoading.set(true);
    this.data
      .list()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (!isSuccess(res) || !res.data) return;
        this.items.set(res.data);

        const target = reselect ?? this.selectedNo();
        const match = res.data.find((t) => t.terminal_no === target);
        if (match) this.select(match);
      });
  }

  select(terminal: ITerminal): void {
    this.selectedNo.set(terminal.terminal_no ?? null);
    this.form.patchValue({
      terminal_no: terminal.terminal_no ?? null,
      terminal_id: terminal.terminal_id ?? '',
      terminal_name: terminal.terminal_name ?? '',
      warehouse_no: terminal.warehouse_no ?? null,
      device_uuid: terminal.device_uuid ?? '',
      receipt_prefix: terminal.receipt_prefix ?? '',
      cash_gl_account_no: terminal.cash_gl_account_no ?? null,
      remarks: terminal.remarks ?? '',
      is_active: terminal.is_active ?? 1,
    });
  }

  newTerminal(): void {
    this.selectedNo.set(null);
    this.form.reset({ terminal_no: null, is_active: 1, receipt_prefix: '' });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Fill in the required fields');
      return;
    }

    const payload = this.form.getRawValue() as ITerminal;
    const no = payload.terminal_no ?? null;

    this.isSaving.set(true);
    const request$ = no ? this.data.update(no, payload) : this.data.save(payload);

    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (!isSuccess(res) || !res.data) return;
        this.toastr.success(no ? 'Terminal updated' : 'Terminal created');
        this.loadList(res.data.terminal_no ?? null);
      },
      error: (err) => this.toastr.error(apiMessage(err, 'Could not save the terminal')),
    });
  }

  remove(): void {
    const no = this.selectedNo();
    if (!no) return;

    this.data.remove(no).subscribe({
      next: () => {
        this.toastr.success('Terminal deleted');
        this.newTerminal();
        this.loadList();
      },
      // The server refuses when a session is open or history exists — say why.
      error: (err) => this.toastr.error(apiMessage(err, 'Could not delete the terminal')),
    });
  }
}

function apiMessage(err: unknown, fallback: string): string {
  const message = (err as { error?: { message?: string } })?.error?.message;
  return message?.trim() ? message : fallback;
}

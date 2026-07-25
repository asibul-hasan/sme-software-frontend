import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ToastrService } from 'ngx-toastr';

import { ActionButtonComponent } from '../actions/action-button.component';
import { statusBadge } from '../components/common-table/status-badge';
import { formatDocumentNumber } from '../numbering/numbering';
import { DataGridComponent } from './data-grid.component';
import type {
  GridChanges,
  GridColumnDef,
  GridConfig,
  GridReadyEvent,
  GridRow,
} from './grid.types';

/**
 * Living reference for the ERP grid — route: `/grid-demo`.
 *
 * <p>One editable line-item grid demonstrating the full interaction model:
 * single click selects, double click opens the WHOLE row for editing, the red ✕
 * hides a row pending save, Add Row appends a line already in edit mode, and the
 * derived columns (Amount / VAT / Total) recalculate after every edit.</p>
 *
 * <p>No business data is touched — safe to delete once the pattern is adopted.</p>
 */
@Component({
  selector: 'app-grid-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataGridComponent, ActionButtonComponent, MatIconModule],
  template: `
    <div class="p-3 d-flex flex-column gap-2">
      <div class="form-section-card card">
        <div
          class="card-header d-flex align-items-center justify-content-between"
        >
          <h4 class="card-header__title mb-0 fw-bold">
            <mat-icon class="me-2 align-middle">receipt_long</mat-icon>
            Purchase Invoice — line items
          </h4>
          <div class="d-flex gap-2">
            <app-action-button
              kind="save"
              [disabled]="!changes().dirty"
              (run)="save()"
            />
            <app-action-button kind="refresh" iconOnly (run)="reload()" />
          </div>
        </div>

        <div class="card-body p-0">
          <app-data-grid
            [columns]="columns"
            [data]="rows()"
            [config]="config()"
            (changesChange)="changes.set($event)"
            (rowClick)="selected.set($event)"
            (gridReady)="grid = $event"
          />
        </div>

        <div class="card-body pt-2">
          <small class="text-muted">
            <strong>Single click</strong> selects ·
            <strong>Double click</strong> edits the whole row ·
            <strong>Tab</strong> moves to the next field and recalculates as you
            go · <strong>Enter</strong> commits, <strong>Esc</strong> cancels ·
            <strong>✕</strong> hides the row until you Save ·
            <strong>Add Row</strong> opens a new line in edit mode. Calculation:
            <code>Amount = Qty × Rate − Discount</code>, VAT 15%,
            <code>Total = Amount + VAT</code>.
          </small>
        </div>
      </div>

      <div class="form-section-card card">
        <div class="card-header">
          <h4 class="card-header__title mb-0 fw-bold">
            <mat-icon class="me-2 align-middle">tune</mat-icon>
            States &amp; standard actions
          </h4>
        </div>
        <div class="card-body d-flex gap-2 flex-wrap">
          <app-action-button
            kind="view"
            label="Normal"
            (run)="setState('normal')"
          />
          <app-action-button
            kind="view"
            label="Loading"
            (run)="setState('loading')"
          />
          <app-action-button
            kind="view"
            label="Empty"
            (run)="setState('empty')"
          />
          <app-action-button
            kind="view"
            label="Error"
            (run)="setState('error')"
          />
          <app-action-button
            kind="delete"
            label="Delete (confirms)"
            (run)="notify('Confirmed')"
          />
          <app-action-button kind="approve" (run)="notify('Approved')" />
          <app-action-button kind="post" (run)="notify('Posted')" />
        </div>
      </div>
    </div>
  `,
})
export class GridDemoComponent {
  private readonly toastr = inject(ToastrService);

  grid?: GridReadyEvent;
  readonly selected = signal<GridRow | null>(null);
  readonly changes = signal<GridChanges>({
    added: [],
    updated: [],
    deleted: [],
    dirty: false,
  });
  private readonly state = signal<'normal' | 'loading' | 'empty' | 'error'>(
    'normal',
  );

  // ── The line calculation — the single place the arithmetic lives ───────────
  private calc(row: GridRow): GridRow {
    const gross = Number(row['qty'] || 0) * Number(row['rate'] || 0);
    const amount = Math.max(0, gross - Number(row['discount'] || 0));
    const vat = Math.round(amount * 0.15 * 100) / 100;
    row['amount'] = amount;
    row['vat'] = vat;
    row['total'] = Math.round((amount + vat) * 100) / 100;
    return row;
  }

  private seed(): GridRow[] {
    return [
      {
        id: 1,
        item: 'Basmati Rice 5kg',
        qty: 10,
        rate: 620,
        discount: 200,
        status: 3,
      },
      {
        id: 2,
        item: 'Soybean Oil 2L',
        qty: 24,
        rate: 385,
        discount: 0,
        status: 1,
      },
      {
        id: 3,
        item: 'Sugar 1kg',
        qty: 50,
        rate: 145,
        discount: 500,
        status: 2,
      },
      {
        id: 4,
        item: 'Red Lentil 1kg',
        qty: 30,
        rate: 175,
        discount: 0,
        status: 1,
      },
      {
        id: 5,
        item: 'Wheat Flour 2kg',
        qty: 40,
        rate: 130,
        discount: 250,
        status: 4,
      },
    ].map((r, i) =>
      this.calc({
        ...r,
        // Numeric enum code — the select must display 'Kg' but store 2.
        unit: (i % 3) + 1,
        doc_no: formatDocumentNumber(i + 1, { prefix: 'PI', year: 2026 }),
      }),
    );
  }

  readonly rows = signal<GridRow[]>(this.seed());

  /** Static enum — in a real form this lives in `{module}.constants.ts`. */
  readonly unitOptions = [
    { value: 1, label: 'Pcs' },
    { value: 2, label: 'Kg' },
    { value: 3, label: 'Litre' },
  ];

  readonly columns: GridColumnDef[] = [
    { title: 'Document No', field: 'doc_no', width: 150, pin: 'left' },
    { title: 'Item', field: 'item', flex: 1, minWidth: 180, editable: true },
    {
      title: 'Unit', field: 'unit', cellType: 'select', width: 110,
      editable: true, options: this.unitOptions,
    },
    {
      title: 'Qty',
      field: 'qty',
      cellType: 'number',
      width: 90,
      editable: true,
      bottomTotal: true,
    },
    {
      title: 'Rate',
      field: 'rate',
      cellType: 'currency',
      width: 110,
      editable: true,
    },
    {
      title: 'Discount',
      field: 'discount',
      cellType: 'currency',
      width: 110,
      editable: true,
    },

    // Derived — read-only by design and recalculated after every edit.
    {
      title: 'Amount',
      field: 'amount',
      cellType: 'currency',
      width: 125,
      bottomTotal: true,
      compute: (r) =>
        Math.max(
          0,
          Number(r['qty'] || 0) * Number(r['rate'] || 0) -
            Number(r['discount'] || 0),
        ),
    },
    {
      title: 'VAT 15%',
      field: 'vat',
      cellType: 'currency',
      width: 110,
      bottomTotal: true,
      compute: (r) => Math.round(Number(r['amount'] || 0) * 0.15 * 100) / 100,
    },
    {
      title: 'Total',
      field: 'total',
      cellType: 'currency',
      width: 130,
      bottomTotal: true,
      compute: (r) =>
        Math.round((Number(r['amount'] || 0) + Number(r['vat'] || 0)) * 100) /
        100,
    },

    {
      title: 'Status',
      field: 'status',
      cellType: 'badge',
      width: 120,
      badgeConfig: (v) => statusBadge(this.statusText(v)),
      value: (r) => this.statusText(r['status']),
    },
  ];

  readonly config = signal<Partial<GridConfig>>(this.buildConfig('normal'));

  private buildConfig(
    state: 'normal' | 'loading' | 'empty' | 'error',
  ): Partial<GridConfig> {
    return {
      // Turns on full-row editing, the Add Row button and the red ✕ column.
      editable: true,
      rowKey: 'id',
      exportFileName: 'purchase-lines',
      pagination: false,
      showSearch: true,
      loading: state === 'loading',
      error:
        state === 'error'
          ? 'The server did not respond. Check your connection and try again.'
          : null,
      // Runs after every committed edit and on every newly added row.
      recalculate: (row) => {
        this.calc(row);
      },
      newRowDefaults: () => ({
        item: '',
        unit: 1,
        qty: 1,
        rate: 0,
        discount: 0,
        status: 1,
        doc_no: formatDocumentNumber(this.rows().length + 1, {
          prefix: 'PI',
          year: 2026,
        }),
      }),
    };
  }

  private statusText(v: unknown): string {
    return (
      ['', 'Draft', 'Pending', 'Approved', 'Rejected'][Number(v)] ?? String(v)
    );
  }

  setState(state: 'normal' | 'loading' | 'empty' | 'error'): void {
    this.state.set(state);
    this.rows.set(state === 'empty' ? [] : this.seed());
    this.config.set(this.buildConfig(state));
  }

  reload(): void {
    this.setState('normal');
    this.grid?.resetChanges();
    this.notify('Reloaded');
  }

  save(): void {
    const c = this.changes();
    this.notify(
      `Saved — ${c.added.length} added, ${c.updated.length} edited, ${c.deleted.length} removed`,
    );
    // A real form POSTs here, then clears the pending state on success.
    this.grid?.resetChanges();
  }

  notify(message: string): void {
    this.toastr.info(message);
  }
}

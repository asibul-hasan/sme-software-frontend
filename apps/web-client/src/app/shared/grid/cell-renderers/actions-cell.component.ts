import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams } from 'ag-grid-community';

import { AlertService } from '../../../core/services/alert.service';
import { erpAction, resolveConfirm } from '../../actions/erp-actions';
import type { GridColumnDef, GridRowAction, GridRow } from '../grid.types';

/**
 * Row-actions cell.
 *
 * <p>Renders up to two actions inline and folds the rest into a kebab (⋯) menu —
 * the same convention the legacy table uses, so rows never turn into a strip of
 * icons. Destructive actions route through {@link AlertService} for confirmation
 * automatically (see {@code resolveConfirm}); a form never has to remember to ask.</p>
 */
@Component({
  selector: 'app-grid-actions-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatMenuModule, MatTooltipModule],
  template: `
    <div class="grid-actions">
      @for (a of inline(); track $index) {
        <button
          type="button"
          class="grid-action-btn"
          [class]="'grid-action-btn--' + variantOf(a)"
          [disabled]="isDisabled(a)"
          [matTooltip]="tooltipOf(a)"
          (click)="run(a, $event)"
        >
          <mat-icon>{{ iconOf(a) }}</mat-icon>
        </button>
      }

      @if (overflow().length) {
        <button
          type="button"
          class="grid-action-btn grid-action-btn--ghost"
          [matMenuTriggerFor]="menu"
          matTooltip="More actions"
          (click)="$event.stopPropagation()"
        >
          <mat-icon>more_horiz</mat-icon>
        </button>
        <mat-menu #menu="matMenu" xPosition="before">
          @for (a of overflow(); track $index) {
            <button mat-menu-item [disabled]="isDisabled(a)" (click)="run(a, $event)">
              <mat-icon [style.color]="colorOf(a)">{{ iconOf(a) }}</mat-icon>
              <span>{{ labelOf(a) }}</span>
            </button>
          }
        </mat-menu>
      }
    </div>
  `,
  styles: [`
    :host { display: flex; align-items: center; height: 100%; }
    .grid-actions { display: inline-flex; align-items: center; gap: 2px; }
    .grid-action-btn {
      width: 28px; height: 28px;
      display: inline-flex; align-items: center; justify-content: center;
      border: none; background: transparent; border-radius: 6px;
      cursor: pointer; color: var(--text-secondary);
      transition: background 0.15s, color 0.15s;
    }
    .grid-action-btn mat-icon { font-size: 17px; width: 17px; height: 17px; }
    .grid-action-btn:hover:not(:disabled) { background: var(--bg-secondary); }
    .grid-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .grid-action-btn--primary:hover:not(:disabled)   { color: var(--primary); }
    .grid-action-btn--success:hover:not(:disabled)   { color: var(--success); }
    .grid-action-btn--danger  { color: var(--danger); }
    .grid-action-btn--danger:hover:not(:disabled)    { background: rgba(var(--danger-rgb), 0.12); }
    .grid-action-btn--warning:hover:not(:disabled)   { color: var(--warning); }
  `],
})
export class GridActionsCellComponent implements ICellRendererAngularComp {
  private readonly alert = inject(AlertService);

  readonly inline = signal<GridRowAction[]>([]);
  readonly overflow = signal<GridRowAction[]>([]);
  private row: GridRow | null = null;

  /** Actions shown as icons before the rest collapse into the kebab menu. */
  private static readonly INLINE_LIMIT = 2;

  agInit(params: ICellRendererParams): void {
    this.resolve(params);
  }

  refresh(params: ICellRendererParams): boolean {
    this.resolve(params);
    return true;
  }

  private resolve(params: ICellRendererParams): void {
    const column = (params.colDef?.context as { column?: GridColumnDef } | undefined)?.column;
    this.row = (params.data as GridRow) ?? null;

    // No actions on the pinned totals row.
    if (!column?.actions || !this.row || params.node.rowPinned) {
      this.inline.set([]);
      this.overflow.set([]);
      return;
    }

    const visible = column.actions.filter((a) => !a.visible || a.visible(this.row as GridRow));
    this.inline.set(visible.slice(0, GridActionsCellComponent.INLINE_LIMIT));
    this.overflow.set(visible.slice(GridActionsCellComponent.INLINE_LIMIT));
  }

  iconOf(a: GridRowAction): string { return a.icon ?? erpAction(a.kind).icon; }
  labelOf(a: GridRowAction): string { return a.label ?? erpAction(a.kind).label; }
  variantOf(a: GridRowAction): string { return a.variant ?? erpAction(a.kind).variant; }
  tooltipOf(a: GridRowAction): string {
    return a.tooltip ?? erpAction(a.kind).tooltip ?? this.labelOf(a);
  }
  colorOf(a: GridRowAction): string {
    const v = this.variantOf(a);
    return v === 'danger' ? 'var(--danger)' : v === 'success' ? 'var(--success)' : '';
  }

  isDisabled(a: GridRowAction): boolean {
    return !!this.row && !!a.disabled && a.disabled(this.row);
  }

  run(a: GridRowAction, event: Event): void {
    // Never let an action click also select/open the row.
    event.stopPropagation();
    const row = this.row;
    if (!row || this.isDisabled(a)) return;

    const confirm = resolveConfirm(a.kind, a.confirm);
    if (!confirm) {
      a.onClick(row);
      return;
    }
    this.alert
      .confirm(confirm.message, confirm.title, confirm.tone)
      .subscribe((ok) => { if (ok) a.onClick(row); });
  }
}

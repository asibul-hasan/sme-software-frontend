import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import type { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams } from 'ag-grid-community';

import type { GridBadgeConfig, GridColumnDef, GridRow } from '../grid.types';

/**
 * Status pill cell. Resolves its label/variant from the column's `badgeConfig`,
 * so a status renders identically here and in the legacy table.
 */
@Component({
  selector: 'app-grid-badge-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (badge(); as b) {
      <span class="grid-badge" [class]="'grid-badge--' + b.variant" [class.grid-badge--solid]="b.solid">
        {{ b.label }}
      </span>
    }
  `,
  styles: [`
    :host { display: flex; align-items: center; height: 100%; }
    .grid-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 10px;
      border-radius: 999px;
      font-size: var(--text-xs, 12px);
      font-weight: 600;
      line-height: 1.6;
      white-space: nowrap;
      border: 1px solid transparent;
    }
    .grid-badge--primary { background: rgba(var(--primary-rgb), 0.12); color: var(--primary); border-color: rgba(var(--primary-rgb), 0.25); }
    .grid-badge--success { background: rgba(var(--success-rgb), 0.12); color: var(--success); border-color: rgba(var(--success-rgb), 0.25); }
    .grid-badge--warning { background: rgba(var(--warning-rgb), 0.12); color: var(--warning); border-color: rgba(var(--warning-rgb), 0.25); }
    .grid-badge--danger  { background: rgba(var(--danger-rgb), 0.12);  color: var(--danger);  border-color: rgba(var(--danger-rgb), 0.25); }
    .grid-badge--info    { background: rgba(var(--info-rgb), 0.12);    color: var(--info);    border-color: rgba(var(--info-rgb), 0.25); }
    .grid-badge--neutral { background: var(--bg-secondary); color: var(--text-secondary); border-color: var(--border-color); }
    .grid-badge--solid.grid-badge--primary { background: var(--primary); color: #fff; }
    .grid-badge--solid.grid-badge--success { background: var(--success); color: #fff; }
    .grid-badge--solid.grid-badge--warning { background: var(--warning); color: #fff; }
    .grid-badge--solid.grid-badge--danger  { background: var(--danger);  color: #fff; }
    .grid-badge--solid.grid-badge--info    { background: var(--info);    color: #fff; }
  `],
})
export class GridBadgeCellComponent implements ICellRendererAngularComp {
  readonly badge = signal<GridBadgeConfig | null>(null);

  agInit(params: ICellRendererParams): void {
    this.resolve(params);
  }

  refresh(params: ICellRendererParams): boolean {
    this.resolve(params);
    return true;
  }

  private resolve(params: ICellRendererParams): void {
    const column = (params.colDef?.context as { column?: GridColumnDef } | undefined)?.column;
    const row = params.data as GridRow | undefined;

    // The pinned bottom (totals) row has no business data — never badge it.
    if (!column?.badgeConfig || !row || params.node.rowPinned) {
      this.badge.set(null);
      return;
    }
    // The RAW field value — a `value` accessor on this column reports the display
    // label for search/export, and feeding that back into badgeConfig would make
    // it map a label instead of the status code it expects.
    this.badge.set(column.badgeConfig(row[column.field], row));
  }
}

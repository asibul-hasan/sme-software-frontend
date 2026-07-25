import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams } from 'ag-grid-community';

import type { GridColumnDef, GridRow } from '../grid.types';

/** Icon cell (`cellType: 'icon'`) — also renders boolean/1-0 flags as a tick or dash. */
@Component({
  selector: 'app-grid-icon-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatTooltipModule],
  template: `
    @if (icon(); as i) {
      <mat-icon [style.color]="color()" [matTooltip]="tooltip()">{{ i }}</mat-icon>
    }
  `,
  styles: [`
    :host { display: flex; align-items: center; height: 100%; }
    mat-icon { font-size: 18px; width: 18px; height: 18px; }
  `],
})
export class GridIconCellComponent implements ICellRendererAngularComp {
  readonly icon = signal<string | null>(null);
  readonly color = signal<string>('');
  readonly tooltip = signal<string>('');

  agInit(params: ICellRendererParams): void { this.resolve(params); }

  refresh(params: ICellRendererParams): boolean {
    this.resolve(params);
    return true;
  }

  private resolve(params: ICellRendererParams): void {
    const column = (params.colDef?.context as { column?: GridColumnDef } | undefined)?.column;
    const row = params.data as GridRow | undefined;

    if (!row || params.node.rowPinned) {
      this.icon.set(null);
      return;
    }

    // The RAW field value, not `params.value` — a column with a `value` accessor
    // reports a display string ('Yes'/'No') for search and export, which must not
    // be what the renderer tests against.
    const raw = column ? row[column.field] : params.value;

    if (column?.iconConfig) {
      const cfg = column.iconConfig(raw, row);
      this.icon.set(cfg?.icon ?? null);
      this.color.set(cfg?.color ?? '');
      this.tooltip.set(cfg?.tooltip ?? '');
      return;
    }

    // No iconConfig → treat the value as a boolean/1-0 flag.
    const truthy = raw === 1 || raw === true || raw === '1';
    this.icon.set(truthy ? 'check_circle' : 'remove');
    this.color.set(truthy ? 'var(--success)' : 'var(--text-secondary)');
    this.tooltip.set(truthy ? 'Yes' : 'No');
  }
}

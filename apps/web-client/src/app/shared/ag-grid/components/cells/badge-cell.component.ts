import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import type { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams } from 'ag-grid-community';

import type { GridBadge, GridColumn, GridRowData } from '../../models/grid-types';

/**
 * Status pill. Resolves label and variant through the column's `badge` mapper so a given status
 * looks the same in every grid in the ERP.
 *
 * Colours come from design tokens rather than literals, so light and dark themes both work
 * without a second definition.
 */
@Component({
  selector: 'app-grid-badge-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (badge(); as b) {
      <span class="grid-badge" [class]="'grid-badge--' + b.variant">{{ b.label }}</span>
    }
  `,
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
        height: 100%;
      }
      .grid-badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 10px;
        border-radius: 999px;
        font-size: var(--text-xs, 12px);
        font-weight: 600;
        line-height: 1.6;
        white-space: nowrap;
      }
      .grid-badge--success {
        background: var(--success-bg, #e7f7ee);
        color: var(--success-text, #0f7a43);
      }
      .grid-badge--danger {
        background: var(--danger-bg, #fdecec);
        color: var(--danger-text, #b42318);
      }
      .grid-badge--warning {
        background: var(--warning-bg, #fff5e6);
        color: var(--warning-text, #b45309);
      }
      .grid-badge--info {
        background: var(--info-bg, #e8f1ff);
        color: var(--info-text, #1d4ed8);
      }
      .grid-badge--neutral {
        background: var(--bg-secondary, #f1f2f4);
        color: var(--text-secondary, #52525b);
      }
    `,
  ],
})
export class GridBadgeCellComponent implements ICellRendererAngularComp {
  readonly badge = signal<GridBadge | null>(null);

  agInit(params: ICellRendererParams): void {
    this.resolve(params);
  }

  refresh(params: ICellRendererParams): boolean {
    this.resolve(params);
    return true;
  }

  private resolve(params: ICellRendererParams): void {
    const column = (params.colDef as { context?: { column?: GridColumn } })?.context?.column;
    const row = params.data as GridRowData | undefined;

    this.badge.set(column?.badge && row ? column.badge(params.value, row) : null);
  }
}

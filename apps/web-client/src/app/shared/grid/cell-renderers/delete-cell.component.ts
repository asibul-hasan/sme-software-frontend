import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams } from 'ag-grid-community';

import type { GridRow } from '../grid.types';

/** Params the grid passes into the delete column. */
export interface DeleteCellParams {
  onDelete: (row: GridRow) => void;
}

/**
 * The line-item delete control — a single red ✕.
 *
 * <p>Clicking it hides the row straight away; the removal is only made permanent
 * when the form saves. Deliberately one unmistakable control rather than a row of
 * icons: on an editable line-item grid the only per-row action is "remove this line".</p>
 */
@Component({
  selector: 'app-grid-delete-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatTooltipModule],
  template: `
    @if (visible()) {
      <button
        type="button"
        class="grid-delete-btn"
        matTooltip="Remove row"
        aria-label="Remove row"
        (click)="remove($event)"
      >
        <mat-icon>close</mat-icon>
      </button>
    }
  `,
  styles: [`
    :host { display: flex; align-items: center; justify-content: center; height: 100%; width: 100%; }
    .grid-delete-btn {
      width: 24px; height: 24px;
      display: inline-flex; align-items: center; justify-content: center;
      border: 1px solid transparent;
      border-radius: 6px;
      background: transparent;
      color: var(--danger);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, transform 0.1s;
    }
    .grid-delete-btn mat-icon { font-size: 17px; width: 17px; height: 17px; }
    .grid-delete-btn:hover {
      background: rgba(var(--danger-rgb), 0.14);
      border-color: rgba(var(--danger-rgb), 0.35);
    }
    .grid-delete-btn:active { transform: scale(0.92); }
  `],
})
export class GridDeleteCellComponent implements ICellRendererAngularComp {
  readonly visible = signal(false);
  private row: GridRow | null = null;
  private onDelete: ((row: GridRow) => void) | null = null;

  agInit(params: ICellRendererParams & Partial<DeleteCellParams>): void { this.resolve(params); }

  refresh(params: ICellRendererParams & Partial<DeleteCellParams>): boolean {
    this.resolve(params);
    return true;
  }

  private resolve(params: ICellRendererParams & Partial<DeleteCellParams>): void {
    this.row = (params.data as GridRow) ?? null;
    this.onDelete = params.onDelete ?? null;
    // Never offer delete on the pinned totals row.
    this.visible.set(!!this.row && !params.node.rowPinned);
  }

  remove(event: Event): void {
    // Must not also select the row or start an edit.
    event.stopPropagation();
    if (this.row) this.onDelete?.(this.row);
  }
}

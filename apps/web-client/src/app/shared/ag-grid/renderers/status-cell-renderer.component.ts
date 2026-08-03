import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { SqlRowState } from '../models/grid-row-state.enum';

@Component({
  selector: 'app-status-cell-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (!isPinned) {
    <div class="d-flex align-items-center justify-content-center h-100">
      @switch (sqlState) {
        @case (SqlRowState.Insert) {
          <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">New</span>
        }
        @case (SqlRowState.Update) {
          <span class="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">Modified</span>
        }
        @case (SqlRowState.Delete) {
          <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">Deleted</span>
        }
        @default {
          <span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1">Saved</span>
        }
      }
    </div>
    }
  `
})
export class StatusCellRendererComponent implements ICellRendererAngularComp {
  public sqlState = SqlRowState.Unchanged;
  public SqlRowState = SqlRowState;
  /** The pinned totals row has no row state to report. */
  protected isPinned = false;

  agInit(params: ICellRendererParams): void {
    this.sqlState = params.data?.__sqlState ?? SqlRowState.Unchanged;
    this.isPinned = !!params.node?.rowPinned;
  }

  refresh(params: ICellRendererParams): boolean {
    this.sqlState = params.data?.__sqlState ?? SqlRowState.Unchanged;
    this.isPinned = !!params.node?.rowPinned;
    return true;
  }
}

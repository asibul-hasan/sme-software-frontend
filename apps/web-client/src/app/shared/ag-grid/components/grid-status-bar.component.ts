import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import type { GridCounts } from '../models/grid-types';

/**
 * Footer status bar: record counts and the current selection.
 *
 * Shows the filtered count separately from the total whenever they differ, so a filtered list
 * can never be mistaken for the whole dataset — the mistake that turns "we have 12 suppliers"
 * into a wrong decision.
 */
@Component({
  selector: 'app-grid-status-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="grid-status">
      <div class="grid-status__left">
        @if (counts().filtered !== counts().total) {
          <span class="grid-status__item grid-status__item--filtered">
            <mat-icon>filter_alt</mat-icon>
            <strong>{{ counts().filtered }}</strong> of {{ counts().total }}
          </span>
        } @else {
          <span class="grid-status__item">
            <strong>{{ counts().total }}</strong>
            {{ counts().total === 1 ? 'record' : 'records' }}
          </span>
        }

        @if (counts().selected > 0) {
          <span class="grid-status__divider"></span>
          <span class="grid-status__item grid-status__item--selected">
            <strong>{{ counts().selected }}</strong> selected
            <button type="button" class="grid-status__clear" (click)="clearSelection.emit()">
              Clear
            </button>
          </span>
        }
      </div>

      <div class="grid-status__right">
        <ng-content />
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .grid-status {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 5px 10px;
        font-size: var(--text-xs, 12px);
        color: var(--text-secondary);
        background: var(--card-bg);
        border-top: 1px solid var(--border-color);
      }
      .grid-status__left,
      .grid-status__right {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .grid-status__item {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .grid-status__item strong {
        color: var(--text-primary);
        font-weight: 600;
      }
      .grid-status__item mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
      .grid-status__item--filtered,
      .grid-status__item--selected {
        color: var(--primary, #6366f1);
      }
      .grid-status__item--selected strong {
        color: var(--primary, #6366f1);
      }
      .grid-status__divider {
        width: 1px;
        height: 12px;
        background: var(--border-color);
      }
      .grid-status__clear {
        border: none;
        background: transparent;
        padding: 0 0 0 4px;
        cursor: pointer;
        font-size: var(--text-xs, 12px);
        font-weight: 600;
        color: var(--primary, #6366f1);
        text-decoration: underline;
      }
    `,
  ],
})
export class GridStatusBarComponent {
  readonly counts = input.required<GridCounts>();
  readonly clearSelection = output<void>();
}

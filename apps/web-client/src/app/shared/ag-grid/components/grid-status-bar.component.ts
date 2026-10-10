import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { UiTooltipDirective } from '@app/shared/ui/tooltip/ui-tooltip.directive';

/**
 * Footer bar: record counts and unsaved-change tallies on the left, pagination on
 * the right. The pager drives AG Grid's own pagination model — the built-in panel
 * is suppressed in `grid-defaults.ts` so this stays the single control.
 */
@Component({
  selector: 'app-grid-status-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, UiTooltipDirective],
  template: `
    <div class="erp-grid-status-bar">
      <div class="erp-grid-status-bar__counts">
        <span>Total Rows: <strong>{{ totalRows() }}</strong></span>
        <span>Selected: <strong>{{ selectedRows() }}</strong></span>
        @if (insertedCount() > 0) {
          <span class="text-success">New: <strong>+{{ insertedCount() }}</strong></span>
        }
        @if (updatedCount() > 0) {
          <span class="text-warning">Modified: <strong>~{{ updatedCount() }}</strong></span>
        }
        @if (deletedCount() > 0) {
          <span class="text-danger">Deleted: <strong>-{{ deletedCount() }}</strong></span>
        }
      </div>

      @if (showPagination()) {
        <div class="erp-grid-pager">
          <span class="erp-grid-pager__range">{{ rangeLabel() }}</span>

          <div class="btn-action-group">
            <button
              type="button"
              class="btn-action btn-reset erp-grid-pager__btn"
              [disabled]="currentPage() === 0"
              (click)="first.emit()"
              uiTooltip="First page"
            >
              <mat-icon class="erp-grid-pager__icon">first_page</mat-icon>
            </button>
            <button
              type="button"
              class="btn-action btn-reset erp-grid-pager__btn"
              [disabled]="currentPage() === 0"
              (click)="previous.emit()"
              uiTooltip="Previous page"
            >
              <mat-icon class="erp-grid-pager__icon">chevron_left</mat-icon>
            </button>
            <span class="erp-grid-pager__page">Page {{ currentPage() + 1 }}</span>
            <button
              type="button"
              class="btn-action btn-reset erp-grid-pager__btn"
              [disabled]="currentPage() >= totalPages() - 1"
              (click)="next.emit()"
              uiTooltip="Next page"
            >
              <mat-icon class="erp-grid-pager__icon">chevron_right</mat-icon>
            </button>
            <button
              type="button"
              class="btn-action btn-reset erp-grid-pager__btn"
              [disabled]="currentPage() >= totalPages() - 1"
              (click)="last.emit()"
              uiTooltip="Last page"
            >
              <mat-icon class="erp-grid-pager__icon">last_page</mat-icon>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .erp-grid-status-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 3px 12px;
        min-height: 32px;
        font-size: 12px;
        flex-wrap: nowrap;
      }

      .erp-grid-status-bar__counts {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        min-width: 0;
        color: var(--text-secondary);
      }

      .erp-grid-pager {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 0 0 auto;
        margin-left: auto;
      }

      .erp-grid-pager__size {
        display: flex;
        align-items: center;
        gap: 4px;
        margin: 0;
        color: var(--text-secondary);
        white-space: nowrap;
      }

      .erp-grid-pager__select {
        width: auto;
        height: 24px;
        padding: 0 20px 0 6px;
        font-size: 12px;
      }

      .erp-grid-pager__range,
      .erp-grid-pager__page {
        color: var(--text-secondary);
        white-space: nowrap;
      }

      .erp-grid-pager__page {
        padding: 0 4px;
        font-weight: 600;
      }

      .erp-grid-pager__btn {
        height: 24px;
        padding: 0 4px;
      }

      .erp-grid-pager__icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    `,
  ],
})
export class GridStatusBarComponent {
  totalRows = input<number>(0);
  selectedRows = input<number>(0);
  insertedCount = input<number>(0);
  updatedCount = input<number>(0);
  deletedCount = input<number>(0);

  showPagination = input<boolean>(false);
  pageSize = input<number>(50);
  pageSizeOptions = input<number[]>([25, 50, 100, 500]);
  currentPage = input<number>(0);
  totalPages = input<number>(1);

  first = output<void>();
  previous = output<void>();
  next = output<void>();
  last = output<void>();
  pageSizeChange = output<number>();

  /** e.g. "1–25 of 137" — the row window currently on screen. */
  protected rangeLabel = computed(() => {
    const total = this.totalRows();
    if (total === 0) return '0 of 0';
    const from = this.currentPage() * this.pageSize() + 1;
    const to = Math.min(from + this.pageSize() - 1, total);
    return `${from}–${to} of ${total}`;
  });

  protected onPageSize(event: Event): void {
    this.pageSizeChange.emit(Number((event.target as HTMLSelectElement).value));
  }
}

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { NgSelectModule } from '@ng-select/ng-select';

import { PaginatorState } from '../../../core/utils/paginator';

@Component({
  selector: 'app-sidebar-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, NgSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="sidebar-pager d-flex align-items-center justify-content-between gap-1 px-2 py-2 border-top flex-shrink-0"
    >
      <div class="d-flex align-items-center gap-1">
        <button
          type="button"
          class="pager-btn"
          [disabled]="pager.currentPage() === 1"
          (click)="pager.firstPage()"
          title="First page"
        >
          <mat-icon>first_page</mat-icon>
        </button>
        <button
          type="button"
          class="pager-btn"
          [disabled]="pager.currentPage() === 1"
          (click)="pager.prevPage()"
          title="Previous page"
        >
          <mat-icon>chevron_left</mat-icon>
        </button>
        <span class="pager-current">{{ pager.currentPage() }}</span>
        <button
          type="button"
          class="pager-btn"
          [disabled]="pager.currentPage() >= pager.totalPages()"
          (click)="pager.nextPage()"
          title="Next page"
        >
          <mat-icon>chevron_right</mat-icon>
        </button>
        <button
          type="button"
          class="pager-btn"
          [disabled]="pager.currentPage() >= pager.totalPages()"
          (click)="pager.lastPage()"
          title="Last page"
        >
          <mat-icon>last_page</mat-icon>
        </button>
      </div>

      <div class="d-flex align-items-center gap-2">
        <span class="pager-total"
          >{{ pager.totalItems() }} <small>Records</small></span
        >
        <ng-select
          class="pager-size"
          [items]="pager.pageSizeOptions"
          [ngModel]="pager.pageSize()"
          (ngModelChange)="pager.setPageSize($event)"
          [clearable]="false"
          [searchable]="false"
        >
          <ng-template ng-label-tmp let-item="item"
            >{{ item }} / page</ng-template
          >
          <ng-template ng-option-tmp let-item="item"
            >{{ item }} / page</ng-template
          >
        </ng-select>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .sidebar-pager {
        background: var(--card-bg);
      }

      .pager-total {
        font-size: 11px;
        font-weight: 700;
        color: var(--text-secondary);
        white-space: nowrap;
        opacity: 0.8;
        background: var(--bg-secondary);
        padding: 4px 8px;
        border-radius: 6px;
        border: 1px solid var(--border-color);
      }

    .pager-btn {
      width: 28px;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border-color);
      background: transparent;
      color: var(--text-secondary);
      border-radius: 6px;
      cursor: pointer;
      padding: 0;
      transition: all 0.15s ease;
    }
    .pager-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      line-height: 16px;
    }
    .pager-btn:hover:not(:disabled) {
      border-color: var(--indigo);
      color: var(--indigo);
      background: rgba(var(--indigo-rgb), 0.08);
    }
    .pager-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .pager-current {
      min-width: 28px;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      background: var(--indigo);
      color: #fff;
      font-weight: 700;
      font-size: 12px;
      padding: 0 8px;
    }

    :host ::ng-deep .pager-size { min-width: 92px; font-size: 11px; }
    :host ::ng-deep .pager-size .ng-select-container {
      min-height: 30px !important;
      height: 30px !important;
      padding: 0 8px !important;
    }
    :host ::ng-deep .pager-size .ng-value-container { min-height: 30px !important; }
  `],
})
export class SidebarPaginationComponent {
  @Input({ required: true }) pager!: PaginatorState<unknown>;
}

import { Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { EmptyStateComponent } from '../empty-state/empty-state.component';

export interface TableColumn<T = unknown> {
  title: string;
  key?: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  sortFn?: ((a: T, b: T) => number) | null;
  left?: string | boolean;
  right?: string | boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  template?: TemplateRef<{ $implicit: T; index?: number; sl?: number } | any>;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, NzTableModule, NzPaginationModule, NzEmptyModule, EmptyStateComponent],
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1 1 0%;
      min-height: 0;
      height: 100%;
      width: 100%;
    }
  `],
  template: `
    <div class="flex flex-col h-full pms-card flex-1 min-h-0">
      <div class="flex-1 min-h-0 flex flex-col overflow-hidden relative">
        <nz-table
          #basicTable
          class="flex-1 min-h-0 flex flex-col h-full"
          [nzData]="data"
          [nzLoading]="loading"
          [nzFrontPagination]="frontPagination"
          [nzTotal]="total"
          [(nzPageIndex)]="pageIndex"
          [(nzPageSize)]="pageSize"
          [nzShowPagination]="false"
          (nzQueryParams)="onQueryParamsChange($event)"
          [nzScroll]="{ x: scrollX }"
          nzSize="middle"
          [nzNoResult]="customNoResult"
        >
          <thead>
            <tr>
              @for (col of columns; track col.title) {
                <th
                  [nzWidth]="col.width || null"
                  [nzAlign]="col.align || 'left'"
                  [nzShowSort]="!!col.sortable"
                  [nzSortFn]="getSortFn(col)"
                  [nzColumnKey]="col.key || ''"
                  [nzLeft]="col.left ?? false"
                  [nzRight]="col.right ?? false"
                  class="font-semibold text-slate-600 text-xs uppercase tracking-wider whitespace-nowrap"
                >
                  {{ col.title }}
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (item of basicTable.data; track $index; let i = $index) {
              <tr
                class="transition-colors"
                [class.row-odd]="i % 2 === 0"
                [class.row-even]="i % 2 === 1"
              >
                @for (col of columns; track col.title) {
                  <td
                    [nzAlign]="col.align || 'left'"
                    [nzLeft]="col.left ?? false"
                    [nzRight]="col.right ?? false"
                    class="text-[13px] text-slate-800"
                  >
                    @if (col.template) {
                      <ng-container
                        *ngTemplateOutlet="col.template; context: { $implicit: item, index: i, sl: (pageIndex - 1) * pageSize + i + 1 }"
                      ></ng-container>
                    } @else if (col.key) {
                      {{ getCellValue(item, col.key) }}
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
          <ng-template #customNoResult>
            <app-empty-state
              [title]="emptyTitle"
              [description]="emptyDescription"
              [stateType]="errorState ? 'error' : (isFiltered ? 'filtered' : 'empty')"
              [icon]="emptyIcon"
              [actionText]="emptyActionText"
              [actionIcon]="emptyActionIcon"
              [actionRoute]="emptyActionRoute"
              (actionClick)="emptyActionClick.emit()"
              [secondaryActionText]="secondaryActionText"
              [secondaryActionIcon]="secondaryActionIcon"
              (secondaryActionClick)="secondaryActionClick.emit()"
              [compact]="true"
              [transparent]="true"
            >
              <ng-content select="[emptyActions]"></ng-content>
            </app-empty-state>
          </ng-template>
        </nz-table>
      </div>

      <!-- Sticky / Fixed Bottom Footer -->
      @if (showFooter) {
        <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-3">
            <ng-content select="[tableFooter]"></ng-content>
          </div>
          @if (showPagination) {
            <div class="flex items-center gap-3">
              <span class="text-slate-500 text-xs hidden sm:inline">
                Showing {{ total > 0 ? (pageIndex - 1) * pageSize + 1 : 0 }} - {{ minVal(pageIndex * pageSize, total) }} of {{ total }}
              </span>
              <nz-pagination
              [(nzPageIndex)]="pageIndex"
              [(nzPageSize)]="pageSize"
              [nzTotal]="total"
              [nzShowSizeChanger]="showSizeChanger"
              [nzPageSizeOptions]="pageSizeOptions"
              (nzPageSizeChange)="onPageSizeChange($event)"
              nzSize="small"
              (nzPageIndexChange)="onPageChange($event)"
            ></nz-pagination>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class DataTableComponent<T = unknown> {
  @Input() data: readonly T[] = [];
  @Input() columns: readonly TableColumn<T>[] = [];
  @Input() loading = false;
  @Input() total = 0;
  @Input() pageIndex = 1;
  @Input() pageSize = 10;
  @Input() frontPagination = true;
  @Input() showPagination = true;
  @Input() showSizeChanger = true;
  @Input() pageSizeOptions = [10, 20, 50, 100];
  @Input() showFooter = true;
  @Input() scrollX = '1100px';

  // Empty & Error State Configuration
  @Input() emptyTitle = 'No records found';
  @Input() emptyDescription = 'No data available in this view.';
  @Input() emptyIcon?: string;
  @Input() emptyActionText?: string;
  @Input() emptyActionIcon = 'plus';
  @Input() emptyActionRoute?: string | any[];
  @Output() emptyActionClick = new EventEmitter<void>();

  @Input() secondaryActionText?: string;
  @Input() secondaryActionIcon = 'reload';
  @Output() secondaryActionClick = new EventEmitter<void>();

  @Input() isFiltered = false;
  @Input() errorState = false;
  @Input() errorMessage?: string;

  @Output() queryParamsChange = new EventEmitter<NzTableQueryParams>();
  @Output() pageIndexChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  onQueryParamsChange(params: NzTableQueryParams): void {
    this.queryParamsChange.emit(params);
  }

  onPageChange(page: number): void {
    this.pageIndex = page;
    this.pageIndexChange.emit(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageSizeChange.emit(size);
  }

  minVal(a: number, b: number): number {
    return Math.min(a, b);
  }

  getSortFn(col: TableColumn<T>): ((a: T, b: T) => number) | null {
    if (!col.sortable) return null;
    if (col.sortFn !== undefined) return col.sortFn;
    if (!col.key) return null;
    const key = col.key;
    return (a: T, b: T) => {
      const va = (a as Record<string, unknown>)[key];
      const vb = (b as Record<string, unknown>)[key];
      if (va == null && vb == null) return 0;
      if (va == null) return -1;
      if (vb == null) return 1;
      if (typeof va === 'number' && typeof vb === 'number') {
        return va - vb;
      }
      return String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: 'base' });
    };
  }

  getCellValue(item: T, key?: string): unknown {
    if (!key || !item) return '—';
    return (item as Record<string, unknown>)[key] ?? '—';
  }
}

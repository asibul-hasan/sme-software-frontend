import { Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

export interface TableColumn<T = unknown> {
  title: string;
  key?: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  left?: string | boolean;
  right?: string | boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  template?: TemplateRef<{ $implicit: T; index?: number; sl?: number } | any>;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, NzTableModule, NzPaginationModule, NzEmptyModule],
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
        >
          <thead>
            <tr>
              @for (col of columns; track col.title) {
                <th
                  [nzWidth]="col.width || null"
                  [nzAlign]="col.align || 'left'"
                  [nzShowSort]="!!col.sortable"
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
        </nz-table>
      </div>

      <!-- Sticky / Fixed Bottom Footer -->
      @if (showFooter) {
        <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-3">
            <ng-content select="[tableFooter]"></ng-content>
          </div>
          @if (showPagination) {
            <nz-pagination
              [(nzPageIndex)]="pageIndex"
              [(nzPageSize)]="pageSize"
              [nzTotal]="total"
              [nzPageSizeOptions]="[10, 20, 50, 100]"
              [nzShowSizeChanger]="true"
              nzSize="small"
              (nzPageIndexChange)="onPageChange($event)"
              (nzPageSizeChange)="onPageSizeChange($event)"
            ></nz-pagination>
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
  @Input() showFooter = true;
  @Input() scrollX = '1100px';

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

  getCellValue(item: T, key?: string): unknown {
    if (!key || !item) return '—';
    return (item as Record<string, unknown>)[key] ?? '—';
  }
}

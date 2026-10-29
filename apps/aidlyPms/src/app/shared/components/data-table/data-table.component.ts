import {
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CdkDropList,
  CdkDrag,
  CdkDragHandle,
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
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
  hidden?: boolean;
  canHide?: boolean;
  groupable?: boolean;
}

export interface TableGroupByOption {
  label: string;
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  groupValueFn?: (item: any) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  summaryFn?: (groupItems: any[]) => string;
}

export interface TableRowGroup<T = unknown> {
  key: string;
  label: string;
  items: T[];
  expanded: boolean;
  summary?: string;
}

export interface TableExportContext<T = unknown> {
  format: 'excel' | 'pdf';
  columns: TableColumn<T>[];
  data: T[];
  isGrouped: boolean;
  groupedRows: TableRowGroup<T>[];
  activeGroupByLabel: string;
  selectedGroupByKey: string;
}

interface ColumnSetting<T> {
  title: string;
  key?: string;
  visible: boolean;
  canHide?: boolean;
  col: TableColumn<T>;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    NzTableModule,
    NzPaginationModule,
    NzSelectModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzPopoverModule,
    NzCheckboxModule,
    NzTagModule,
    NzTooltipModule,
    NzDropDownModule,
    NzEmptyModule,
    EmptyStateComponent,
  ],
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        flex: 1 1 0%;
        min-height: 0;
        height: 100%;
        width: 100%;
      }
    `,
  ],
  template: `
    <div
      class="flex flex-col h-full pms-card flex-1 min-h-0 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs"
    >
      <!-- Top Table Toolbar -->
      @if (showToolbar && (groupByOptions.length > 0 || showSearch || showColumnCustomizer || showBorderedTool || showSizeChangerTool)) {
        <div
          class="table-toolbar px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0"
        >
          <!-- Left: Group by Selector -->
          <div class="flex items-center gap-2">
            @if (groupByOptions.length > 0) {
              <div
                class="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1 shadow-2xs"
              >
                <span class="text-xs font-semibold text-slate-700 whitespace-nowrap"
                  >Group by</span
                >
                <nz-select
                  class="w-36 text-xs"
                  nzSize="small"
                  [(ngModel)]="selectedGroupByKey"
                  (ngModelChange)="onGroupByChange($event)"
                  nzVariant="borderless"
                  nzPlaceHolder="-"
                >
                  <nz-option nzValue="" nzLabel="-"></nz-option>
                  @for (opt of groupByOptions; track opt.key) {
                    <nz-option [nzValue]="opt.key" [nzLabel]="opt.label"></nz-option>
                  }
                </nz-select>
              </div>
            }
            <ng-content select="[toolbarLeft]"></ng-content>
          </div>

          <!-- Right: Search, Size, Bordered, Column Customizer -->
          <div class="flex items-center gap-2">
            @if (showSearch) {
              <nz-input-group
                [nzPrefix]="searchIconTpl"
                [nzSuffix]="clearSearchTpl"
                class="w-48 sm:w-60 rounded-md bg-white border-slate-300"
              >
                <input
                  type="text"
                  nz-input
                  nzSize="small"
                  [placeholder]="searchPlaceholder"
                  [(ngModel)]="searchTerm"
                  (ngModelChange)="onSearchChange($event)"
                  class="text-xs"
                  aria-label="Search"
                />
              </nz-input-group>
              <ng-template #searchIconTpl>
                <span nz-icon nzType="search" class="text-slate-400 text-xs"></span>
              </ng-template>
              <ng-template #clearSearchTpl>
                @if (searchTerm) {
                  <span
                    nz-icon
                    nzType="close-circle"
                    nzTheme="fill"
                    class="text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
                    (click)="clearSearch()"
                  ></span>
                }
              </ng-template>
            }

            <!-- Table Density Size Toggle -->
            @if (showSizeChangerTool) {
              <button
                type="button"
                nz-button
                nzSize="small"
                nzType="default"
                class="rounded-md w-8 h-8 p-0 flex items-center justify-center bg-white border-slate-300 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors"
                nz-dropdown
                [nzDropdownMenu]="sizeMenu"
                nzTrigger="click"
                title="Table Density / Size"
                aria-label="Table Density"
              >
                <span nz-icon nzType="column-height" class="text-sm"></span>
              </button>
              <nz-dropdown-menu #sizeMenu="nzDropdownMenu">
                <ul nz-menu nzSelectable class="rounded-md shadow-lg py-1 min-w-[150px]">
                  <li
                    nz-menu-item
                    (click)="setSize('small')"
                    [nzSelected]="size === 'small'"
                    class="text-xs"
                  >
                    <span nz-icon nzType="menu"></span> Small (Compact)
                  </li>
                  <li
                    nz-menu-item
                    (click)="setSize('middle')"
                    [nzSelected]="size === 'middle'"
                    class="text-xs"
                  >
                    <span nz-icon nzType="menu"></span> Middle (Standard)
                  </li>
                  <li
                    nz-menu-item
                    (click)="setSize('default')"
                    [nzSelected]="size === 'default'"
                    class="text-xs"
                  >
                    <span nz-icon nzType="menu"></span> Default (Relaxed)
                  </li>
                </ul>
              </nz-dropdown-menu>
            }

            <!-- Columns Customizer Icon Button & Popover -->
            @if (showColumnCustomizer) {
              <button
                type="button"
                nz-button
                nzSize="small"
                nzType="default"
                nz-popover
                nzOverlayClassName="pms-columns-popover"
                [nzPopoverContent]="columnsPopoverTpl"
                nzPopoverTrigger="click"
                nzPopoverPlacement="bottomRight"
                [(nzPopoverVisible)]="columnsPopoverVisible"
                (nzPopoverVisibleChange)="onPopoverVisibleChange($event)"
                class="rounded-md w-8 h-8 p-0 flex items-center justify-center bg-white border-slate-300 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors"
                title="Customize Columns"
                aria-label="Customize Columns"
              >
                <span nz-icon nzType="table" class="text-sm"></span>
              </button>

              <ng-template #columnsPopoverTpl>
                <div class="p-3.5 w-64 text-xs select-none">
                  <!-- Popover Header -->
                  <div
                    class="flex items-center justify-between pb-2 mb-2.5 border-b border-zinc-800"
                  >
                    <span class="font-bold text-sm text-white">Columns</span>
                    <button
                      type="button"
                      (click)="resetColumns()"
                      class="text-xs font-semibold text-orange-400 hover:text-orange-300 hover:underline cursor-pointer bg-transparent border-none p-0"
                    >
                      Reset
                    </button>
                  </div>

                  <!-- Reorderable Column Checkbox List -->
                  <div
                    cdkDropList
                    (cdkDropListDropped)="onColumnDrop($event)"
                    class="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar"
                  >
                    @for (col of draftColumns; track col.key || col.title) {
                      <div
                        cdkDrag
                        class="flex items-center justify-between py-1 px-1.5 rounded hover:bg-zinc-800/80 transition-colors"
                      >
                        <label
                          nz-checkbox
                          [(ngModel)]="col.visible"
                          [nzDisabled]="col.canHide === false"
                          class="text-xs text-zinc-200 cursor-pointer"
                        >
                          {{ col.title }}
                        </label>
                        <span
                          cdkDragHandle
                          class="text-zinc-500 hover:text-zinc-300 cursor-grab active:cursor-grabbing font-mono text-sm px-1"
                          title="Drag to reorder"
                        >
                          &#x3d;
                        </span>
                      </div>
                    }
                  </div>

                  <!-- Apply Button -->
                  <button
                    nz-button
                    nzType="primary"
                    class="w-full mt-3 rounded-md font-semibold text-xs h-8 bg-blue-600 hover:bg-blue-500 border-none"
                    (click)="applyColumns()"
                  >
                    Apply columns
                  </button>
                </div>
              </ng-template>
            }

            <!-- Download / Export Tool -->
            @if (showDownloadTool) {
              <button
                type="button"
                nz-button
                nzSize="small"
                nzType="default"
                nz-dropdown
                [nzDropdownMenu]="downloadMenu"
                nzTrigger="click"
                class="rounded-md w-8 h-8 p-0 flex items-center justify-center bg-white border-slate-300 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors"
                title="Export Data (Excel / PDF)"
                aria-label="Export Data"
              >
                <span nz-icon nzType="download" class="text-sm"></span>
              </button>
              <nz-dropdown-menu #downloadMenu="nzDropdownMenu">
                <ul nz-menu class="rounded-md shadow-lg py-1 min-w-[155px]">
                  <li
                    nz-menu-item
                    (click)="triggerExport('excel')"
                    class="flex items-center gap-2 text-xs py-1.5 px-3"
                  >
                    <span nz-icon nzType="file-excel" class="text-emerald-600 text-sm"></span>
                    <span>Export Excel (.xlsx)</span>
                  </li>
                  <li
                    nz-menu-item
                    (click)="triggerExport('pdf')"
                    class="flex items-center gap-2 text-xs py-1.5 px-3"
                  >
                    <span nz-icon nzType="file-pdf" class="text-rose-600 text-sm"></span>
                    <span>Export PDF (.pdf)</span>
                  </li>
                </ul>
              </nz-dropdown-menu>
            }

            <ng-content select="[toolbarRight]"></ng-content>
          </div>
        </div>
      }

      <!-- Main Table Scroll Area with Fixed Header Support -->
      <div class="flex-1 min-h-0 flex flex-col overflow-hidden relative">
        <nz-table
          #basicTable
          class="flex-1 min-h-0 flex flex-col h-full"
          [nzData]="tableData"
          [nzLoading]="loading"
          [nzFrontPagination]="frontPagination"
          [nzTotal]="effectiveTotal"
          [(nzPageIndex)]="pageIndex"
          [(nzPageSize)]="pageSize"
          [nzShowPagination]="false"
          (nzQueryParams)="onQueryParamsChange($event)"
          [nzScroll]="scrollConfig"
          [nzSize]="size"
          [nzBordered]="bordered"
          [nzNoResult]="customNoResult"
        >
          <thead>
            <tr>
              @for (col of visibleColumns; track col.key || col.title) {
                <th
                  [nzWidth]="col.width || null"
                  [nzAlign]="col.align || 'left'"
                  [nzShowSort]="!!col.sortable"
                  [nzSortFn]="getSortFn(col)"
                  [nzColumnKey]="col.key || ''"
                  [nzLeft]="getFixedLeft(col)"
                  [nzRight]="getFixedRight(col)"
                  [class.ant-table-cell-fix-right-first]="!!col.right"
                  [class.ant-table-cell-fix-left-last]="!!col.left"
                  class="font-semibold text-slate-600 text-xs uppercase tracking-wider whitespace-nowrap"
                >
                  {{ col.title }}
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @if (selectedGroupByKey && groupedRows.length > 0) {
              <!-- Grouped Row Mode -->
              @for (grp of groupedRows; track grp.key) {
                <!-- Group Header Row -->
                <tr
                  class="bg-slate-100/90 hover:bg-slate-200/90 cursor-pointer transition-colors border-y border-slate-200 select-none"
                  (click)="toggleGroup(grp)"
                >
                  <td
                    [attr.colspan]="visibleColumns.length"
                    class="py-2.5 px-3 font-semibold text-xs text-slate-800"
                  >
                    <div class="flex items-center gap-2">
                      <span
                        nz-icon
                        [nzType]="grp.expanded ? 'down' : 'right'"
                        class="text-xs text-slate-500"
                      ></span>
                      <span class="font-bold text-slate-900"
                        >{{ activeGroupByLabel }}: {{ grp.label }}</span
                      >
                      <nz-tag
                        nzColor="blue"
                        class="text-[10px] font-mono rounded-full px-2"
                        >{{ grp.items.length }}
                        {{ grp.items.length === 1 ? 'item' : 'items' }}</nz-tag
                      >
                      @if (grp.summary) {
                        <span
                          class="text-xs text-slate-600 font-normal ml-3 font-mono"
                          >{{ grp.summary }}</span
                        >
                      }
                    </div>
                  </td>
                </tr>
                @if (grp.expanded) {
                  @for (item of grp.items; track getItemTrack(item, $index); let i = $index) {
                    <tr
                      class="transition-colors"
                      [class.row-odd]="i % 2 === 0"
                      [class.row-even]="i % 2 === 1"
                    >
                      @for (col of visibleColumns; track col.key || col.title) {
                        <td
                          [nzAlign]="col.align || 'left'"
                          [nzLeft]="getFixedLeft(col)"
                          [nzRight]="getFixedRight(col)"
                          [class.ant-table-cell-fix-right-first]="!!col.right"
                          [class.ant-table-cell-fix-left-last]="!!col.left"
                          class="text-[13px] text-slate-800"
                        >
                          @if (col.template) {
                            <ng-container
                              *ngTemplateOutlet="
                                col.template;
                                context: {
                                  $implicit: item,
                                  index: i,
                                  sl: (pageIndex - 1) * pageSize + i + 1
                                }
                              "
                            ></ng-container>
                          } @else if (col.key) {
                            {{ getCellValue(item, col.key) }}
                          }
                        </td>
                      }
                    </tr>
                  }
                }
              }
            } @else {
              <!-- Standard Flat Rows -->
              @for (item of basicTable.data; track getItemTrack(item, $index); let i = $index) {
                <tr
                  class="transition-colors"
                  [class.row-odd]="i % 2 === 0"
                  [class.row-even]="i % 2 === 1"
                >
                  @for (col of visibleColumns; track col.key || col.title) {
                    <td
                      [nzAlign]="col.align || 'left'"
                      [nzLeft]="getFixedLeft(col)"
                      [nzRight]="getFixedRight(col)"
                      [class.ant-table-cell-fix-right-first]="!!col.right"
                      [class.ant-table-cell-fix-left-last]="!!col.left"
                      class="text-[13px] text-slate-800"
                    >
                      @if (col.template) {
                        <ng-container
                          *ngTemplateOutlet="
                            col.template;
                            context: {
                              $implicit: item,
                              index: i,
                              sl: (pageIndex - 1) * pageSize + i + 1
                            }
                          "
                        ></ng-container>
                      } @else if (col.key) {
                        {{ getCellValue(item, col.key) }}
                      }
                    </td>
                  }
                </tr>
              }
            }
          </tbody>
          <ng-template #customNoResult>
            <app-empty-state
              [title]="emptyTitle"
              [description]="emptyDescription"
              [stateType]="errorState ? 'error' : isFiltered ? 'filtered' : 'empty'"
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
        <div
          class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs"
        >
          <div class="flex items-center gap-3">
            <ng-content select="[tableFooter]"></ng-content>
          </div>
          @if (showPagination) {
            <div class="flex items-center gap-3">
              <span class="text-slate-500 text-xs hidden sm:inline">
                Showing
                {{ effectiveTotal > 0 ? (pageIndex - 1) * pageSize + 1 : 0 }} -
                {{ minVal(pageIndex * pageSize, effectiveTotal) }} of
                {{ effectiveTotal }}
              </span>
              <nz-pagination
                [(nzPageIndex)]="pageIndex"
                [(nzPageSize)]="pageSize"
                [nzTotal]="effectiveTotal"
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
export class DataTableComponent<T = unknown> implements OnInit, OnChanges {
  @Input() data: readonly T[] = [];
  @Input() columns: readonly TableColumn<T>[] = [];
  @Input() loading = false;
  @Input() total = 0;
  @Input() pageIndex = 1;
  @Input() pageSize = 15;
  @Input() frontPagination = true;
  @Input() showPagination = true;
  @Input() showSizeChanger = true;
  @Input() pageSizeOptions = [10, 15, 25, 50, 100];
  @Input() showFooter = true;
  @Input() scrollX = '1100px';
  @Input() scrollY: string | null = 'calc(100vh - 350px)';
  @Input() bordered = true;
  @Input() size: 'default' | 'middle' | 'small' = 'middle';

  // Toolbar Configuration
  @Input() showToolbar = false;
  @Input() showSearch = false;
  @Input() searchPlaceholder = 'Search table...';
  @Input() showBorderedTool = false;
  @Input() showSizeChangerTool = false;
  @Input() showColumnCustomizer = false;
  @Input() showDownloadTool = false;
  @Input() groupByOptions: TableGroupByOption[] = [];
  @Input() defaultGroupBy = '';

  // Empty & Error State Configuration
  @Input() emptyTitle = 'No records found';
  @Input() emptyDescription = 'No data available in this view.';
  @Input() emptyIcon?: string;
  @Input() emptyActionText?: string;
  @Input() emptyActionIcon = 'plus';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  @Output() searchChange = new EventEmitter<string>();
  @Output() groupByChange = new EventEmitter<string>();
  @Output() sizeChange = new EventEmitter<'default' | 'middle' | 'small'>();
  @Output() borderedChange = new EventEmitter<boolean>();
  @Output() visibleColumnsChange = new EventEmitter<TableColumn<T>[]>();
  @Output() export = new EventEmitter<TableExportContext<T>>();
  @Output() exportExcel = new EventEmitter<TableExportContext<T>>();
  @Output() exportPdf = new EventEmitter<TableExportContext<T>>();

  // Internal State
  searchTerm = '';
  selectedGroupByKey = '';
  groupedRows: TableRowGroup<T>[] = [];

  columnsSettings: ColumnSetting<T>[] = [];
  draftColumns: ColumnSetting<T>[] = [];
  visibleColumns: TableColumn<T>[] = [];
  columnsPopoverVisible = false;

  get scrollConfig(): { x: string | null; y: string | null } {
    return {
      x: this.scrollX || null,
      y: this.scrollY || null,
    };
  }

  get processedData(): T[] {
    let list = this.data ? [...this.data] : [];
    if (this.searchTerm && this.searchTerm.trim()) {
      const q = this.searchTerm.trim().toLowerCase();
      list = list.filter((item) => {
        if (!item) return false;
        return Object.values(item as Record<string, unknown>).some(
          (val) => val != null && String(val).toLowerCase().includes(q)
        );
      });
    }
    return list;
  }

  get tableData(): T[] {
    return this.processedData;
  }

  get effectiveTotal(): number {
    if (this.searchTerm && this.searchTerm.trim()) {
      return this.processedData.length;
    }
    return this.total || (this.data ? this.data.length : 0);
  }

  get activeGroupByLabel(): string {
    const opt = this.groupByOptions.find((o) => o.key === this.selectedGroupByKey);
    return opt ? opt.label : 'Group';
  }

  ngOnInit(): void {
    if (this.defaultGroupBy) {
      this.selectedGroupByKey = this.defaultGroupBy;
    }
    this.initColumns();
    this.updateGroupedRows();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns']) {
      this.initColumns();
    }
    if (changes['data'] || changes['groupByOptions']) {
      this.updateGroupedRows();
    }
  }

  initColumns(): void {
    this.columnsSettings = (this.columns || []).map((col) => ({
      title: col.title,
      key: col.key,
      visible: col.hidden !== true,
      canHide: col.canHide !== false,
      col,
    }));
    this.draftColumns = this.columnsSettings.map((c) => ({ ...c }));
    this.updateVisibleColumns();
  }

  onPopoverVisibleChange(visible: boolean): void {
    if (visible) {
      // Sync draft columns with current active configuration
      this.draftColumns = this.columnsSettings.map((c) => ({ ...c }));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onColumnDrop(event: CdkDragDrop<any[]>): void {
    moveItemInArray(this.draftColumns, event.previousIndex, event.currentIndex);
  }

  resetColumns(): void {
    this.draftColumns = (this.columns || []).map((col) => ({
      title: col.title,
      key: col.key,
      visible: col.hidden !== true,
      canHide: col.canHide !== false,
      col,
    }));
    this.applyColumns();
  }

  applyColumns(): void {
    this.columnsSettings = this.draftColumns.map((c) => ({ ...c }));
    this.updateVisibleColumns();
    this.columnsPopoverVisible = false;
  }

  private updateVisibleColumns(): void {
    const unpinned: TableColumn<T>[] = [];
    const pinnedRight: TableColumn<T>[] = [];
    const pinnedLeft: TableColumn<T>[] = [];

    for (const c of this.columnsSettings) {
      if (!c.visible) continue;
      if (c.col.left) {
        pinnedLeft.push(c.col);
      } else if (c.col.right) {
        pinnedRight.push(c.col);
      } else {
        unpinned.push(c.col);
      }
    }
    this.visibleColumns = [...pinnedLeft, ...unpinned, ...pinnedRight];
    this.visibleColumnsChange.emit(this.visibleColumns);
  }

  getFixedRight(col: TableColumn<T>): string | false {
    if (col.right == null || col.right === false) return false;
    return col.right === true ? '0px' : String(col.right);
  }

  getFixedLeft(col: TableColumn<T>): string | false {
    if (col.left == null || col.left === false) return false;
    return col.left === true ? '0px' : String(col.left);
  }

  triggerExport(format: 'excel' | 'pdf'): void {
    const ctx: TableExportContext<T> = {
      format,
      columns: [...this.visibleColumns],
      data: [...this.processedData],
      isGrouped: !!this.selectedGroupByKey && this.groupedRows.length > 0,
      groupedRows: this.groupedRows.map((g) => ({ ...g, items: [...g.items] })),
      activeGroupByLabel: this.activeGroupByLabel,
      selectedGroupByKey: this.selectedGroupByKey,
    };
    this.export.emit(ctx);
    if (format === 'excel') this.exportExcel.emit(ctx);
    if (format === 'pdf') this.exportPdf.emit(ctx);
  }

  onGroupByChange(key: string): void {
    this.selectedGroupByKey = key;
    this.groupByChange.emit(key);
    this.updateGroupedRows();
  }

  updateGroupedRows(): void {
    if (!this.selectedGroupByKey) {
      this.groupedRows = [];
      return;
    }

    const opt = this.groupByOptions.find((o) => o.key === this.selectedGroupByKey);
    const key = this.selectedGroupByKey;
    const source = this.processedData;
    const groupsMap = new Map<string, T[]>();

    for (const item of source) {
      let groupVal: string;
      if (opt?.groupValueFn) {
        groupVal = opt.groupValueFn(item);
      } else {
        const raw = (item as Record<string, unknown>)[key];
        groupVal =
          raw != null && String(raw).trim() !== '' ? String(raw) : 'Unassigned';
      }

      const list = groupsMap.get(groupVal) || [];
      list.push(item);
      groupsMap.set(groupVal, list);
    }

    this.groupedRows = Array.from(groupsMap.entries()).map(([val, items]) => {
      return {
        key: val,
        label: val,
        items,
        expanded: true,
        summary: opt?.summaryFn ? opt.summaryFn(items) : undefined,
      };
    });
  }

  toggleGroup(group: TableRowGroup<T>): void {
    group.expanded = !group.expanded;
  }

  onSearchChange(val: string): void {
    this.searchTerm = val;
    this.searchChange.emit(val);
    this.pageIndex = 1;
    this.pageIndexChange.emit(1);
    if (this.selectedGroupByKey) {
      this.updateGroupedRows();
    }
  }

  clearSearch(): void {
    this.onSearchChange('');
  }

  toggleBordered(): void {
    this.bordered = !this.bordered;
    this.borderedChange.emit(this.bordered);
  }

  setSize(newSize: 'default' | 'middle' | 'small'): void {
    this.size = newSize;
    this.sizeChange.emit(newSize);
  }

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
      return String(va).localeCompare(String(vb), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    };
  }

  getCellValue(item: T, key?: string): unknown {
    if (!key || !item) return '—';
    return (item as Record<string, unknown>)[key] ?? '—';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getItemTrack(item: T, index: number): any {
    if (item && typeof item === 'object') {
      const rec = item as Record<string, unknown>;
      return (
        rec['sale_invoice_no'] ??
        rec['id'] ??
        rec['product_no'] ??
        rec['inv'] ??
        index
      );
    }
    return index;
  }
}

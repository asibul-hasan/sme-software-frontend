import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { UiMenuComponent } from '@app/shared/ui/menu/ui-menu.component';
import { UiMenuTriggerDirective } from '@app/shared/ui/menu/ui-menu-trigger.directive';
import { UiTooltipDirective } from '@app/shared/ui/tooltip/ui-tooltip.directive';
import { GridToolbarConfig } from '../models/grid-config.model';

/** Export formats offered by the toolbar — same set as `<app-common-table>`. */
export type GridExportFormat = 'excel' | 'pdf' | 'csv' | 'print';

/** One toggleable column, as surfaced in the column-chooser menu. */
export interface GridToolbarColumn {
  colId: string;
  headerName: string;
  visible: boolean;
}

/**
 * Grid header bar. Deliberately mirrors `<app-common-table>`'s toolbar
 * (`.btn-action-group` + `.btn-action.btn-reset`, `view_column` / `file_download`)
 * so a form looks the same whichever table it uses.
 *
 * Layout is ONE row that never wraps: title + record actions on the left, and the
 * search box + icon buttons right-aligned as a single group.
 */
@Component({
  selector: 'app-grid-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatIconModule, UiMenuComponent, UiMenuTriggerDirective, UiTooltipDirective],
  template: `
    <div class="erp-grid-toolbar card-header">
      <!-- Left: title + record actions -->
      <div class="erp-grid-toolbar__left">
        @if (config().title) {
          <h4 class="card-header__title mb-0 fw-bold erp-grid-toolbar__title">
            <mat-icon class="me-1 align-middle erp-grid-toolbar__title-icon">table_view</mat-icon>
            {{ config().title }}
          </h4>
        }
        @if (config().showAdd !== false && canAdd()) {
          <button type="button" class="btn-action btn-new" (click)="add.emit()" uiTooltip="Add a new row">
            <mat-icon class="erp-grid-toolbar__icon">add</mat-icon>
            <span class="btn-action-label">Add Row</span>
          </button>
        }
        @if (config().showDelete !== false) {
          <button
            type="button"
            class="btn-action btn-delete"
            [disabled]="selectedCount() === 0"
            (click)="deleteSelected.emit()"
            uiTooltip="Delete the selected rows"
          >
            <mat-icon class="erp-grid-toolbar__icon">delete</mat-icon>
            <span class="btn-action-label">Delete</span>
          </button>
        }
      </div>

      <!-- Right: search + icon buttons, one group -->
      <div class="erp-grid-toolbar__right">
        @if (config().showSearch !== false) {
          <div class="erp-grid-toolbar__search">
            <mat-icon class="erp-grid-toolbar__search-icon">search</mat-icon>
            <input
              type="text"
              class="form-control common-table-search"
              [placeholder]="config().searchPlaceholder || 'Search...'"
              [ngModel]="searchValue()"
              (ngModelChange)="searchChange.emit($event)"
            />
            @if (searchValue()) {
              <button
                type="button"
                class="erp-grid-toolbar__search-clear"
                aria-label="Clear search"
                (click)="searchChange.emit('')"
              >
                <mat-icon class="erp-grid-toolbar__clear-icon">close</mat-icon>
              </button>
            }
          </div>
        }

        <div class="btn-action-group">
          @if (config().showColumnChooser !== false) {
            <button type="button" class="btn-action btn-reset" [uiMenuTriggerFor]="columnMenu" uiTooltip="Columns">
              <mat-icon class="erp-grid-toolbar__icon">view_column</mat-icon>
            </button>
            <ui-menu #columnMenu>
              <div class="erp-grid-menu erp-grid-menu--columns">
                <div class="erp-grid-menu__head">
                  <span class="erp-grid-menu__title">Columns</span>
                  <div class="d-flex gap-1">
                    <button
                      type="button"
                      class="btn-action btn-save erp-grid-menu__headbtn"
                      (click)="saveColumns.emit(); $event.stopPropagation()"
                    >
                      <mat-icon class="erp-grid-toolbar__clear-icon">save</mat-icon>
                      Save
                    </button>
                    <button
                      type="button"
                      class="btn-action btn-reset erp-grid-menu__headbtn"
                      (click)="resetLayout.emit(); $event.stopPropagation()"
                    >
                      <mat-icon class="erp-grid-toolbar__clear-icon">restart_alt</mat-icon>
                    </button>
                  </div>
                </div>
                @for (col of columns(); track col.colId) {
                  <label class="erp-grid-menu__row erp-grid-menu__row--check">
                    <!-- A real input: a mat-icon ligature renders nothing until the icon
                         font loads, which is why the checkboxes appeared missing. -->
                    <input
                      type="checkbox"
                      class="erp-grid-menu__checkbox"
                      [checked]="col.visible"
                      (change)="toggleColumn.emit(col.colId); $event.stopPropagation()"
                      (click)="$event.stopPropagation()"
                    />
                    <span class="erp-grid-menu__label">{{ col.headerName }}</span>
                  </label>
                }
              </div>
            </ui-menu>
          }

          @if (config().showExport !== false) {
            <button type="button" class="btn-action btn-reset" [uiMenuTriggerFor]="exportMenu" uiTooltip="Export">
              <mat-icon class="erp-grid-toolbar__icon">file_download</mat-icon>
            </button>
            <ui-menu #exportMenu>
              <div class="erp-grid-menu erp-grid-menu--export">
                @for (fmt of exportFormats; track fmt.id) {
                  <button type="button" class="erp-grid-menu__row" (click)="exportAs.emit(fmt.id)">
                    <mat-icon class="erp-grid-menu__icon" [style.color]="fmt.color">{{ fmt.icon }}</mat-icon>
                    <span>{{ fmt.label }}</span>
                  </button>
                }
              </div>
            </ui-menu>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .erp-grid-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 4px 12px;
        min-height: 40px;
        flex-wrap: nowrap;
      }

      .erp-grid-toolbar__left {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
      }

      /* Search + icon buttons are ONE segmented control: same height, flush against
         each other, single border between segments, only the outer corners rounded.
         The global .btn-action-group is a spaced cluster (gap + padding + per-button
         radius), so every one of those is neutralised here. */
      .erp-grid-toolbar__right {
        display: flex;
        align-items: stretch;
        gap: 0;
        min-width: 0;
        height: 28px;
      }

      .erp-grid-toolbar__right .common-table-search {
        border-top-right-radius: 0 !important;
        border-bottom-right-radius: 0 !important;
      }

      .erp-grid-toolbar__right .btn-action-group {
        gap: 0;
        padding: 0;
        height: 28px;
      }

      .erp-grid-toolbar__right .btn-action-group > .btn-action {
        height: 28px;
        border-radius: 0;
        border-color: var(--input-border);
        margin-left: -1px; /* collapse the doubled border between segments */
      }

      /* Only the far end of the group keeps its corners.
         last-of-type, not last-child: each button is followed by its ui-menu
         overlay template, so no button is ever the group's last child. */
      .erp-grid-toolbar__right .btn-action-group > .btn-action:last-of-type {
        border-top-right-radius: 6px;
        border-bottom-right-radius: 6px;
      }

      /* Raise the hovered/focused segment so its border wins over the neighbour's. */
      .erp-grid-toolbar__right .btn-action-group > .btn-action:hover,
      .erp-grid-toolbar__right .btn-action-group > .btn-action:focus-visible {
        position: relative;
        z-index: 1;
      }

      /* The right group never shrinks — search + buttons stay together on one line. */
      .erp-grid-toolbar__right {
        flex: 0 0 auto;
        margin-left: auto;
      }

      .erp-grid-toolbar__title {
        font-size: 14px;
        white-space: nowrap;
        margin-right: 4px;
      }

      .erp-grid-toolbar__title-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .erp-grid-toolbar__icon {
        font-size: 17px;
        width: 17px;
        height: 17px;
      }

      .erp-grid-toolbar__clear-icon {
        font-size: 15px;
        width: 15px;
        height: 15px;
      }

      .erp-grid-toolbar__search {
        position: relative;
        display: flex;
        align-items: center;
        width: 210px;
      }

      /* The global .form-control rule is 42px tall — far too heavy for a toolbar. */
      .erp-grid-toolbar__search .common-table-search {
        height: 28px !important;
        min-height: 28px !important;
        padding-top: 0;
        padding-bottom: 0;
        font-size: 12.5px;
      }

      .erp-grid-toolbar__search-icon {
        position: absolute;
        left: 8px;
        font-size: 17px;
        width: 17px;
        height: 17px;
        pointer-events: none;
        z-index: 1;
        color: var(--text-secondary);
      }

      .erp-grid-toolbar__search .common-table-search {
        padding-left: 30px;
        padding-right: 26px;
        border-radius: 6px;
      }

      .erp-grid-toolbar__search-clear {
        position: absolute;
        right: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border: 0;
        border-radius: 4px;
        background: transparent;
        cursor: pointer;
        color: var(--text-secondary);
      }

      /* Both menus stay narrow — they hold short labels, not prose.
         The overlay panel is rendered outside this component and carries a
         200px floor, so the override is global but scoped by :has() to our
         menus only — every other ui-menu in the app keeps its default. */
      ::ng-deep .ui-menu-panel:has(.erp-grid-menu) {
        /* !important: ui-menu's own scoped rule ties on specificity and wins on order. */
        min-width: 0 !important;
      }

      .erp-grid-menu {
        padding: 4px 0;
      }

      .erp-grid-menu--columns {
        min-width: 178px;
        max-width: 210px;
        max-height: 300px;
        overflow-y: auto;
      }

      .erp-grid-menu--export {
        min-width: 132px;
      }

      .erp-grid-menu__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        padding: 6px 10px;
        border-bottom: 1px solid var(--border-color);
      }

      .erp-grid-menu__title {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-secondary);
      }

      .erp-grid-menu__headbtn {
        height: 22px;
        padding: 0 6px;
        font-size: 10px;
      }

      .erp-grid-menu__row {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        margin: 0;
        padding: 6px 10px;
        border: 0;
        background: transparent;
        font-size: 12.5px;
        color: var(--text-primary);
        text-align: left;
        cursor: pointer;
      }

      .erp-grid-menu__row:hover {
        background: var(--select-bg);
      }

      .erp-grid-menu__row--check {
        user-select: none;
      }

      .erp-grid-menu__checkbox {
        width: 15px;
        height: 15px;
        margin: 0;
        flex: 0 0 auto;
        accent-color: var(--select-text, #4f6ef7);
        cursor: pointer;
      }

      .erp-grid-menu__icon {
        font-size: 17px;
        width: 17px;
        height: 17px;
        flex: 0 0 auto;
      }

      .erp-grid-menu__label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `,
  ],
})
export class GridToolbarComponent {
  config = input<GridToolbarConfig>({});
  searchValue = input<string>('');
  selectedCount = input<number>(0);
  columns = input<GridToolbarColumn[]>([]);
  /** Insert permission — hides Add Row when the user may not create rows. */
  canAdd = input<boolean>(true);

  add = output<void>();
  deleteSelected = output<void>();
  searchChange = output<string>();
  exportAs = output<GridExportFormat>();
  resetLayout = output<void>();
  saveColumns = output<void>();
  toggleColumn = output<string>();

  /** Same four formats, icons and colours as `<app-common-table>`'s export menu. */
  protected readonly exportFormats: {
    id: GridExportFormat;
    label: string;
    icon: string;
    color: string;
  }[] = [
    { id: 'excel', label: 'Excel', icon: 'description', color: 'var(--success)' },
    { id: 'pdf', label: 'PDF', icon: 'picture_as_pdf', color: 'var(--danger)' },
    { id: 'csv', label: 'CSV', icon: 'file_download', color: 'var(--primary)' },
    { id: 'print', label: 'Print', icon: 'print', color: 'var(--text-secondary)' },
  ];
}

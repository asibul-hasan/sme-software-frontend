import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  HostListener,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent, NgSelectConfig, NgSelectModule } from '@ng-select/ng-select';
import { ICellEditorAngularComp } from 'ag-grid-angular';
import { ICellEditorParams } from 'ag-grid-community';
import { GridLookupOption } from '../models/grid-config.model';
import { matchLookupOption, resolveLookupOptions } from '../utils/lookup-options';

/**
 * Clears `appendTo` for this editor only, leaving every other app-wide ng-select default
 * intact. The `appendTo` INPUT cannot do this: ng-select resolves it as
 * `appendTo() || config.appendTo`, so any falsy input falls back to the global `'body'`.
 */
function provideInlineDropdownConfig(): NgSelectConfig {
  const global = inject(NgSelectConfig, { skipSelf: true });
  const config = Object.assign(new NgSelectConfig(), global);
  config.appendTo = undefined as unknown as string;
  return config;
}

/** Extra params the grid passes through `colDef.cellEditorParams` for select/lookup columns. */
export interface SelectCellEditorParams<T = any> extends ICellEditorParams<T> {
  options?: GridLookupOption[] | ((row: T) => GridLookupOption[]);
  clearable?: boolean;
}

/**
 * Select / lookup cell editor.
 *
 * Runs as a POPUP editor — an inline editor is clipped by the cell's `overflow: hidden`.
 *
 * The scoped `NgSelectConfig` below is REQUIRED — it undoes the app-wide
 * `NgSelectConfig.appendTo = 'body'` set in app.component.ts. The panel must stay INSIDE
 * the AG Grid popup: `stopEditingWhenCellsLoseFocus` makes the editor a modal popup, which
 * AG Grid tears down on any mousedown outside the popup element. With the panel on `body`,
 * clicking an option destroys the editor before the option's click handler runs — the
 * dropdown closes and the selection is silently dropped (keyboard Enter still works, which
 * is the tell). Keeping it inline costs a z-index fix, see the styles below.
 */
@Component({
  selector: 'app-select-cell-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NgSelectModule],
  providers: [{ provide: NgSelectConfig, useFactory: provideInlineDropdownConfig }],
  template: `
    <ng-select
      #ngSelect
      [appendTo]="fullRow ? 'body' : ''"
      dropdownPosition="auto"
      bindLabel="label"
      bindValue="value"
      [items]="options"
      [(ngModel)]="value"
      [ngModelOptions]="{ standalone: true }"
      [clearable]="clearable"
      [virtualScroll]="options.length > 100"
      (change)="onSelectionChange()"
    ></ng-select>
  `,
  styles: [
    `
      /* Global (leading ::ng-deep) — AG Grid owns this wrapper, it is not in our template.
         .ag-header is position:absolute; z-index:1, while .ag-popup-editor and
         .ng-dropdown-panel both have z-index:auto — so an upward-opening list paints
         BEHIND the column headers. Lifting the popup above the header fixes it, and
         :has() keeps the rule inert for every other cell editor. */
      ::ng-deep .ag-popup-editor:has(app-select-cell-editor) {
        z-index: 10;
      }

      :host {
        display: block;
        box-sizing: border-box;
        /* Themed, not hardcoded — a white popup on a dark grid is jarring. */
        background: var(--card-bg, #ffffff);
        border: 1px solid var(--select-text, #4f6ef7);
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      }

      /* Inline: sit in the row of editors and look identical to the text inputs
         beside it. Values come from AG Grid's own input tokens rather than being
         hardcoded, so the lookup tracks the theme instead of drifting from it.
         Without this the control stays transparent and the selected-row tint shows
         through, which is why it read as a different colour from its neighbours. */
      :host(.is-inline) {
        width: 100%;
        background: transparent;
        border: 0;
        border-radius: 0;
        box-shadow: none;
      }

      :host(.is-inline) ::ng-deep .ng-select-container {
        height: 28px !important;
        min-height: 28px !important;
        background: var(--ag-input-background-color, #fff) !important;
        border: var(--ag-input-border, solid 1px rgba(99, 120, 255, 0.14)) !important;
        border-radius: var(--ag-border-radius, 4px) !important;
        box-shadow: none !important;
      }

      :host(.is-inline) ::ng-deep .ng-value-container {
        padding-left: 8px !important;
      }

      :host ::ng-deep .ng-select-container {
        min-height: 30px !important;
        height: 30px !important;
        border: none !important;
        background: transparent !important;
        font-size: 13px !important;
      }

      :host ::ng-deep .ng-value-container {
        padding-left: 6px !important;
      }
    `,
  ],
})
export class SelectCellEditorComponent<T = any> implements ICellEditorAngularComp {
  @ViewChild('ngSelect') private ngSelect?: NgSelectComponent;

  /** A popup editor sizes to its content, which collapses to nothing on an empty cell. */
  @HostBinding('style.width') protected width: string | null = null;
  /** Inline mode must not paint the popup's own border/shadow inside the cell. */
  @HostBinding('class.is-inline') protected get inline(): boolean {
    return this.fullRow;
  }

  protected options: GridLookupOption[] = [];
  protected value: unknown = null;
  protected clearable = false;
  /** True when the grid is in full-row edit mode — changes popup vs inline behaviour. */
  protected fullRow = false;

  private params!: SelectCellEditorParams<T>;
  /** Guards `stopEditing()` from running twice — change and Enter can both fire. */
  private stopped = false;

  agInit(params: SelectCellEditorParams<T>): void {
    this.params = params;
    this.options = resolveLookupOptions(params.options, params.data);
    this.clearable = params.clearable ?? false;
    this.fullRow = params.api.getGridOption('editType') === 'fullRow';
    // Inline editors are sized by the cell; only the popup needs an explicit width.
    this.width = this.fullRow ? null : `${Math.max(params.column.getActualWidth(), 160)}px`;

    // Store the option's OWN value, so the editor round-trips the exact type the
    // backend persists even when the row arrived with a string/number mismatch.
    // Without this the current value never shows up as selected.
    // A code with no matching option is kept as-is rather than nulled — committing
    // without touching the list must not wipe a legacy value.
    const matched = matchLookupOption(this.options, params.value);
    this.value = matched ? matched.value : params.value ?? null;
  }

  /**
   * Opens the list ONLY for the cell the user actually started editing.
   *
   * The click (or keypress) that starts an edit never reaches ng-select, so that cell
   * has to be focused and opened by hand. But under full-row editing EVERY cell in the
   * row gets an editor, and opening unconditionally rips focus away from the cell the
   * user double-clicked and parks it in this dropdown. `cellStartedEdit` is true for
   * exactly one cell, which is the one that should get focus.
   */
  afterGuiAttached(): void {
    if (!this.params.cellStartedEdit) return;
    setTimeout(() => {
      this.ngSelect?.focus();
      this.ngSelect?.open();
    });
  }

  focusIn(): void {
    this.ngSelect?.focus();
  }

  /**
   * Popup for single-cell editing, INLINE for full-row editing.
   *
   * `stopEditingWhenCellsLoseFocus` makes a popup editor modal, and AG Grid destroys a
   * modal popup on any mousedown outside it. Under full-row editing that means clicking
   * another field in the same row tears this editor down and ends the whole row edit.
   * An inline editor has no popup to dismiss, so the row survives.
   */
  isPopup(): boolean {
    return !this.fullRow;
  }

  getPopupPosition(): 'over' {
    return 'over';
  }

  getValue(): unknown {
    return this.value;
  }

  /**
   * ng-select owns list navigation while the panel is open. Without this the grid
   * intercepts the arrows and moves the selected cell out from under the editor.
   */
  @HostListener('keydown', ['$event'])
  protected onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        event.stopPropagation();
        this.cancelEditing();
        break;
      case 'Enter':
        event.stopPropagation();
        // Enter with the panel already closed means "commit what is selected".
        if (!this.ngSelect?.isOpen()) this.commit();
        break;
      case 'ArrowUp':
      case 'ArrowDown':
      case 'PageUp':
      case 'PageDown':
      case 'Home':
      case 'End':
        event.stopPropagation();
        break;
      default:
        // Tab and printable keys keep their normal grid / ng-select behaviour.
        break;
    }
  }

  protected onSelectionChange(): void {
    this.commit();
  }

  /** Commits async — destroying the editor inside ng-select's own event handler throws. */
  private commit(): void {
    if (this.stopped) return;

    // In full-row editing, `stopEditing()` would end the WHOLE row, so picking a
    // lookup mid-row would kick the user out. The value is already in `this.value`;
    // AG Grid reads it via getValue() when the row itself commits.
    if (this.params.api.getGridOption('editType') === 'fullRow') {
      this.ngSelect?.close();
      return;
    }

    this.stopped = true;
    setTimeout(() => this.params.stopEditing());
  }

  private cancelEditing(): void {
    if (this.stopped) return;
    this.stopped = true;
    setTimeout(() => this.params.api.stopEditing(true));
  }
}

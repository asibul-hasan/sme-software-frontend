import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, type TemplateRef } from '@angular/core';
import type { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams } from 'ag-grid-community';

import type { GridColumn, GridRowData } from '../../models/grid-types';

/** Context handed to a projected cell template. */
export interface GridCellContext {
  $implicit: GridRowData;
  row: GridRowData;
  value: unknown;
  column: GridColumn | undefined;
}

/**
 * Renders a form-supplied template inside a cell (`cellType: 'template'`).
 *
 * This is the escape hatch: anything the built-in cell types cannot express — an inline action
 * bar, a composite of two fields, a progress bar — is written as ordinary Angular markup in the
 * form and looked up here by name. It keeps the framework small without making it a ceiling.
 */
@Component({
  selector: 'app-grid-template-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  template: `
    @if (template(); as tpl) {
      <ng-container *ngTemplateOutlet="tpl; context: context()" />
    }
  `,
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
        height: 100%;
        width: 100%;
      }
    `,
  ],
})
export class GridTemplateCellComponent implements ICellRendererAngularComp {
  readonly template = signal<TemplateRef<GridCellContext> | null>(null);
  readonly context = signal<GridCellContext | null>(null);

  agInit(params: ICellRendererParams): void {
    this.resolve(params);
  }

  refresh(params: ICellRendererParams): boolean {
    this.resolve(params);
    return true;
  }

  private resolve(params: ICellRendererParams): void {
    const ctx = (params.colDef as {
      context?: { column?: GridColumn; templates?: Map<string, TemplateRef<GridCellContext>> };
    })?.context;

    const column = ctx?.column;
    const row = (params.data ?? {}) as GridRowData;
    const name = column?.templateName;

    this.template.set(name ? (ctx?.templates?.get(name) ?? null) : null);
    this.context.set({ $implicit: row, row, value: params.value, column });
  }
}

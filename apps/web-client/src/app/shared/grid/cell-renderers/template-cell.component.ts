import { ChangeDetectionStrategy, Component, signal, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import type { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams } from 'ag-grid-community';

import type { GridColumnDef, GridRow } from '../grid.types';

/**
 * Renders a caller-supplied `TemplateRef` inside a cell (`cellType: 'custom-template'`).
 *
 * <p>Template context mirrors the legacy table so markup ports unchanged:
 * `$implicit` / `row` = the row, `value` = the cell value, `column` = the column def.</p>
 */
@Component({
  selector: 'app-grid-template-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  template: `
    @if (tpl(); as t) {
      <ng-container *ngTemplateOutlet="t; context: context()" />
    }
  `,
  styles: [`:host { display: flex; align-items: center; height: 100%; width: 100%; }`],
})
export class GridTemplateCellComponent implements ICellRendererAngularComp {
  readonly tpl = signal<TemplateRef<unknown> | null>(null);
  readonly context = signal<Record<string, unknown>>({});

  agInit(params: ICellRendererParams): void { this.resolve(params); }

  refresh(params: ICellRendererParams): boolean {
    this.resolve(params);
    return true;
  }

  private resolve(params: ICellRendererParams): void {
    const column = (params.colDef?.context as { column?: GridColumnDef } | undefined)?.column;
    const row = params.data as GridRow | undefined;

    if (!column?.customTemplate || !row || params.node.rowPinned) {
      this.tpl.set(null);
      return;
    }
    this.tpl.set(column.customTemplate);
    this.context.set({ $implicit: row, row, value: params.value, column });
  }
}

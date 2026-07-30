import { Directive, inject, input, TemplateRef } from '@angular/core';

import type { GridCellContext } from '../components/cells/template-cell.component';

/**
 * Declares a named cell template inside `<app-grid>`.
 *
 * ```html
 * <app-grid [config]="grid" [data]="rows()">
 *   <ng-template appGridCell="actions" let-row>
 *     <app-action-button kind="edit" (run)="edit(row)" />
 *   </ng-template>
 * </app-grid>
 * ```
 *
 * ```ts
 * col.template('__actions', '', 'actions').width(90).pin('right').done()
 * ```
 *
 * Templates are matched by **name**, not position, so column order can change without silently
 * pairing a column with the wrong markup.
 */
@Directive({
  selector: '[appGridCell]',
  standalone: true,
})
export class GridCellDirective {
  /** Name referenced by a column's `templateName`. */
  readonly appGridCell = input.required<string>();

  readonly template = inject<TemplateRef<GridCellContext>>(TemplateRef);

  /** Lets a template be used with `let-row` and typed context in strict templates. */
  static ngTemplateContextGuard(
    _dir: GridCellDirective,
    _ctx: unknown,
  ): _ctx is GridCellContext {
    return true;
  }
}

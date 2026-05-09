import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
} from '@angular/core';
import { FormPermissionService } from '../services/form-permission.service';

type FormAction = 'view' | 'insert' | 'update' | 'delete';

/**
 * Structural directive that renders its template only when the current user
 * has the given action on the active form (as loaded by
 * {@link FormPermissionService}).
 *
 * @example
 * ```html
 * <button *appHasPermission="'insert'" (click)="onSave()">Save</button>
 * <button *appHasPermission="'delete'" (click)="onDelete()">Delete</button>
 * ```
 */
@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private readonly templateRef   = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly permissions   = inject(FormPermissionService);

  private action: FormAction | null = null;
  private rendered = false;

  constructor() {
    // Re-evaluate whenever the underlying permission signal flips.
    effect(() => {
      this.permissions.permission();
      this.updateView();
    });
  }

  @Input() set appHasPermission(action: FormAction) {
    this.action = action;
    this.updateView();
  }

  private updateView(): void {
    if (!this.action) return;

    const allowed = this.permissions.hasPermission(this.action);
    if (allowed && !this.rendered) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.rendered = true;
    } else if (!allowed && this.rendered) {
      this.viewContainer.clear();
      this.rendered = false;
    }
  }
}

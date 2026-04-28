import { Directive, Input, TemplateRef, ViewContainerRef, effect } from '@angular/core';
import { FormPermissionService } from '../services/form-permission.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private permissionAction: 'create' | 'update' | 'delete' | 'view' | null = null;
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private formPermissionService: FormPermissionService
  ) {
    effect(() => {
      // Re-evaluate whenever the signal changes
      this.formPermissionService.currentPermission();
      this.updateView();
    });
  }

  @Input() set appHasPermission(action: 'create' | 'update' | 'delete' | 'view') {
    this.permissionAction = action;
    this.updateView();
  }

  private updateView() {
    if (!this.permissionAction) return;

    const hasPermission = this.formPermissionService.hasPermission(this.permissionAction);

    if (hasPermission && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

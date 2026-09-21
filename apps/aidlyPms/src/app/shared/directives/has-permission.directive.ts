import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private readonly templateRef = inject(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);

  private hasView = false;

  @Input() set appHasPermission(permissionCode: string) {
    const isAuthorized = this.authService.hasPermission(permissionCode);

    if (isAuthorized && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!isAuthorized && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

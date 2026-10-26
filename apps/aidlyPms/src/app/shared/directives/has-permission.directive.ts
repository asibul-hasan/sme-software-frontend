import {
  Directive,
  ElementRef,
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
  private readonly templateRef = inject(TemplateRef, { optional: true });
  private readonly viewContainer = inject(ViewContainerRef, { optional: true });
  private readonly elementRef = inject(ElementRef, { optional: true });
  private readonly authService = inject(AuthService);

  private hasView = false;

  @Input() set appHasPermission(permissionCode: string | null | undefined) {
    const isAuthorized = permissionCode ? this.authService.hasPermission(permissionCode) : true;

    if (isAuthorized) {
      this.show();
    } else {
      this.hide();
    }
  }

  private show(): void {
    if (this.templateRef && this.viewContainer) {
      if (!this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      }
    } else if (this.elementRef?.nativeElement) {
      this.elementRef.nativeElement.style.display = '';
      if ('disabled' in this.elementRef.nativeElement) {
        this.elementRef.nativeElement.disabled = false;
      }
    }
  }

  private hide(): void {
    if (this.templateRef && this.viewContainer) {
      if (this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    } else if (this.elementRef?.nativeElement) {
      this.elementRef.nativeElement.style.display = 'none';
      if ('disabled' in this.elementRef.nativeElement) {
        this.elementRef.nativeElement.disabled = true;
      }
    }
  }
}

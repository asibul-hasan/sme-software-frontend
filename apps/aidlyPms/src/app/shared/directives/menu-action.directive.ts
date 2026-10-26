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
  selector: '[appMenuAction]',
  standalone: true,
})
export class MenuActionDirective {
  private readonly templateRef = inject(TemplateRef, { optional: true });
  private readonly viewContainer = inject(ViewContainerRef, { optional: true });
  private readonly elementRef = inject(ElementRef, { optional: true });
  private readonly authService = inject(AuthService);

  private hasView = false;

  @Input() set appMenuAction(val: string | [string, 'view' | 'create' | 'edit' | 'delete'] | null | undefined) {
    if (!val) {
      this.show();
      return;
    }

    let menuCode = '';
    let action: 'view' | 'create' | 'edit' | 'delete' = 'view';

    if (Array.isArray(val)) {
      menuCode = val[0];
      action = val[1] || 'view';
    } else if (typeof val === 'string') {
      const parts = val.split(':');
      menuCode = parts[0]?.trim();
      if (parts[1]) {
        const act = parts[1].trim().toLowerCase();
        if (act === 'view' || act === 'create' || act === 'edit' || act === 'delete') {
          action = act;
        }
      }
    }

    const isAuthorized = this.authService.hasMenuAccess(menuCode, action);

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

import { Directive, ElementRef, Renderer2, OnInit, OnDestroy, Optional, Host } from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

@Directive({
  selector: '[formControl], [formControlName]',
  standalone: true,
})
export class ValidationMessageDirective implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private errorElement: HTMLElement | null = null;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    @Optional() @Host() private control: NgControl,
  ) {}

  ngOnInit(): void {
    // Use setTimeout(0) to defer check until AFTER Angular processes validation
    this.control?.valueChanges?.pipe(takeUntil(this.destroy$)).subscribe(() => {
      setTimeout(() => this.updateState(), 0);
    });
    this.control?.statusChanges?.pipe(takeUntil(this.destroy$)).subscribe(() => {
      setTimeout(() => this.updateState(), 0);
    });
  }

  private updateState(): void {
    const ctrl = this.control;
    if (!ctrl) return;

    const isInvalid = ctrl.invalid && (ctrl.dirty || ctrl.touched);

    if (isInvalid) {
      this.showError(this.getErrorMessage());
    } else {
      this.removeError();
    }
  }

  private getErrorMessage(): string {
    const errors = this.control?.errors;
    if (!errors) return '';

    if (errors['required']) return 'This field is required';
    if (errors['email']) return 'Invalid email address';
    if (errors['maxlength']) return `Maximum length is ${errors['maxlength'].requiredLength}`;

    return 'Invalid value';
  }

  private showError(msg: string): void {
    if (!this.errorElement) {
      // Reuse an existing message node if one is already under this field —
      // guards against orphans when a directive instance is destroyed mid-error.
      const parent: HTMLElement | null = this.el.nativeElement.parentElement;
      const existing = parent?.querySelector(':scope > .invalid-feedback');
      if (existing) {
        this.errorElement = existing as HTMLElement;
      } else {
        this.errorElement = this.renderer.createElement('div');
        this.renderer.addClass(this.errorElement, 'invalid-feedback');
        this.renderer.setStyle(this.errorElement, 'display', 'block');
        this.renderer.setStyle(this.errorElement, 'font-size', '11px');
        this.renderer.setStyle(this.errorElement, 'margin-top', '4px');
        this.renderer.appendChild(parent, this.errorElement);
      }
    }
    this.renderer.setProperty(this.errorElement, 'innerText', msg);
    this.renderer.addClass(this.el.nativeElement, 'is-invalid');
  }

  private removeError(): void {
    // Detach directly: Renderer2.removeChild goes through the animations
    // renderer, which can defer/drop the removal and leave the node behind.
    this.errorElement?.remove();
    this.errorElement = null;
    this.renderer.removeClass(this.el.nativeElement, 'is-invalid');
  }

  ngOnDestroy(): void {
    this.removeError();
    this.destroy$.next();
    this.destroy$.complete();
  }
}

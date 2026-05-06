import { Directive, Input, ElementRef, Renderer2, OnInit, OnDestroy, Optional, Host } from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

@Directive({
  selector: '[formControl], [formControlName]',
  standalone: true
})
export class ValidationMessageDirective implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private errorElement: HTMLElement | null = null;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    @Optional() @Host() private control: NgControl
  ) {}

  ngOnInit(): void {
    if (this.control?.statusChanges) {
      this.control.statusChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.updateErrorMessage());
    }
  }

  private updateErrorMessage(): void {
    const isInvalid = this.control?.invalid && (this.control?.dirty || this.control?.touched);
    
    if (isInvalid) {
      const errorMsg = this.getErrorMessage();
      this.showError(errorMsg);
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
      this.errorElement = this.renderer.createElement('div');
      this.renderer.addClass(this.errorElement, 'invalid-feedback');
      this.renderer.setStyle(this.errorElement, 'display', 'block');
      this.renderer.setStyle(this.errorElement, 'font-size', '11px');
      this.renderer.setStyle(this.errorElement, 'margin-top', '4px');
      
      const parent = this.el.nativeElement.parentElement;
      this.renderer.appendChild(parent, this.errorElement);
    }
    this.renderer.setProperty(this.errorElement, 'innerText', msg);
    this.renderer.addClass(this.el.nativeElement, 'is-invalid');
  }

  private removeError(): void {
    if (this.errorElement) {
      this.renderer.removeChild(this.el.nativeElement.parentElement, this.errorElement);
      this.errorElement = null;
    }
    this.renderer.removeClass(this.el.nativeElement, 'is-invalid');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

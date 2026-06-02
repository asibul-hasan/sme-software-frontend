import { Directive, ElementRef, inject } from '@angular/core';

/**
 * Makes native `<input type="date">` open the calendar picker
 * when clicking anywhere on the field, not just the icon.
 *
 * Apply globally via `appShowDatepicker` or include in a module's imports
 * to auto-activate on all date inputs.
 */
@Directive({
  selector: 'input[type="date"]',
  standalone: true,
})
export class ShowDatepickerDirective {
  private el = inject(ElementRef<HTMLInputElement>);

  constructor() {
    const input = this.el.nativeElement;

    input.addEventListener('click', () => {
      // showPicker() is supported in modern browsers
      if (typeof input.showPicker === 'function') {
        input.showPicker();
      }
    });

    // Ensure the cursor indicates the whole field is clickable
    input.style.cursor = 'pointer';
  }
}

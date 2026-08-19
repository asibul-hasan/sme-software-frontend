import { Directive, ElementRef, effect, inject } from '@angular/core';
import { AppSettingsService } from '@app/core/services/app-settings.service';

/**
 * Marks a number input as holding an AMOUNT, so its step follows the company's
 * configured decimal places instead of a hard-coded one.
 *
 * Precision is loaded at bootstrap from `base_currency_settings.decimal_places`
 * and lands in `AppSettingsService`. A literal `step="0.01"` silently assumed
 * two decimals everywhere: on a company configured for 3, typing 1.234 fails
 * HTML5 step validation and the control goes invalid; on a 0-decimal currency
 * the spinner still offers fractions the backend will not keep.
 *
 * Use it ONLY for money. A field with its own natural scale — a percentage, an
 * exchange rate at six places, a leave day in quarters — keeps its explicit
 * `step`, exactly as grid columns keep an explicit `.precision(n)`.
 *
 * ```html
 * <input type="number" formControlName="paid_amount" class="form-control" appDecimalInput />
 * ```
 */
@Directive({
  selector: 'input[appDecimalInput]',
  standalone: true,
})
export class DecimalInputDirective {
  private el = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private settings = inject(AppSettingsService);

  constructor() {
    // An effect, not a one-time read: switching branch or company can reload the
    // active currency, and the step has to follow it without rebuilding the form.
    effect(() => {
      const p = this.settings.current().precision;
      this.el.nativeElement.step = p > 0 ? (1 / 10 ** p).toFixed(p) : '1';
    });
  }
}

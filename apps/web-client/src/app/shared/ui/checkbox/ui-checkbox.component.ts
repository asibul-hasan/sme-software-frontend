import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  model,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Checkbox — replaces `mat-checkbox` / Bootstrap `.form-check`.
 *
 * A `ControlValueAccessor`, so it works with `formControlName`,
 * `[(ngModel)]`, and two-way `[(checked)]`.
 */
@Component({
  selector: 'ui-checkbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label
      class="inline-flex items-center gap-2 select-none"
      [class.cursor-pointer]="!disabled()"
      [class.opacity-60]="disabled()"
    >
      <input
        type="checkbox"
        class="size-4 shrink-0 accent-indigo cursor-pointer disabled:cursor-not-allowed"
        [checked]="checked()"
        [disabled]="disabled()"
        (change)="onToggle($event)"
        (blur)="onTouched()"
      />
      <span class="text-sm text-content"><ng-content /></span>
    </label>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiCheckboxComponent),
      multi: true,
    },
  ],
})
export class UiCheckboxComponent implements ControlValueAccessor {
  readonly checked = model(false);
  readonly disabled = model(false);

  private onChangeFn: (value: boolean) => void = () => {};
  onTouched: () => void = () => {};

  onToggle(event: Event): void {
    const value = (event.target as HTMLInputElement).checked;
    this.checked.set(value);
    this.onChangeFn(value);
  }

  writeValue(value: boolean): void {
    this.checked.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}

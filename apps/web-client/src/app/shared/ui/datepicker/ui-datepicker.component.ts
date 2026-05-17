import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  model,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Date field — replaces `mat-datepicker`.
 *
 * Wraps a native `<input type="date">` (ISO `yyyy-MM-dd` value) as a
 * `ControlValueAccessor`. A custom CDK-overlay calendar can replace
 * the native picker later without changing this component's API.
 */
@Component({
  selector: 'ui-datepicker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input
      type="date"
      [value]="value() ?? ''"
      [attr.min]="min() || null"
      [attr.max]="max() || null"
      [disabled]="disabled()"
      [class]="classes()"
      (input)="onInput($event)"
      (blur)="onTouched()"
    />
  `,
  host: { class: 'block w-full' },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiDatepickerComponent),
      multi: true,
    },
  ],
})
export class UiDatepickerComponent implements ControlValueAccessor {
  readonly min = input('');
  readonly max = input('');
  readonly invalid = input(false, { transform: booleanAttribute });

  readonly value = model<string | null>(null);
  readonly disabled = model(false);

  private onChangeFn: (value: string | null) => void = () => {};
  onTouched: () => void = () => {};

  readonly classes = computed(
    () =>
      'h-[42px] w-full rounded-md border bg-input px-3 text-base text-content ' +
      'outline-none transition-colors ' +
      'hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 ' +
      'disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-80 ' +
      (this.invalid() ? 'border-danger' : 'border-input-border'),
  );

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value || null;
    this.value.set(value);
    this.onChangeFn(value);
  }

  writeValue(value: string | null): void {
    this.value.set(value);
  }
  registerOnChange(fn: (value: string | null) => void): void {
    this.onChangeFn = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}

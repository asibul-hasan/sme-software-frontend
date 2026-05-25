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

export type UiInputType =
  | 'text'
  | 'number'
  | 'email'
  | 'password'
  | 'tel'
  | 'url'
  | 'search';

/**
 * Text input — replaces Bootstrap `.form-control` text fields.
 * A `ControlValueAccessor`: works with `formControlName` / `ngModel`.
 */
@Component({
  selector: 'ui-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input
      [type]="type()"
      [value]="value() ?? ''"
      [placeholder]="placeholder()"
      [readOnly]="readonly()"
      [disabled]="disabled()"
      [attr.inputmode]="type() === 'number' ? 'decimal' : null"
      [class]="classes()"
      (input)="onInput($event)"
      (blur)="onTouched()"
    />
  `,
  host: { class: 'block w-full' },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiInputComponent),
      multi: true,
    },
  ],
})
export class UiInputComponent implements ControlValueAccessor {
  readonly type = input<UiInputType>('text');
  readonly placeholder = input('');
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });

  readonly value = model<string | number | null>(null);
  readonly disabled = model(false);

  private onChangeFn: (value: string | number | null) => void = () => {};
  onTouched: () => void = () => {};

  readonly classes = computed(
    () =>
      'h-[42px] w-full rounded-md border bg-input px-3 text-base text-content ' +
      'outline-none transition-colors placeholder:text-subtle/60 ' +
      'hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 ' +
      'disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-80 ' +
      'read-only:bg-muted ' +
      (this.invalid() ? 'border-danger' : 'border-input-border'),
  );

  onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const value =
      this.type() === 'number' ? (raw === '' ? null : Number(raw)) : raw;
    this.value.set(value);
    this.onChangeFn(value);
  }

  writeValue(value: string | number | null): void {
    this.value.set(value);
  }
  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChangeFn = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}

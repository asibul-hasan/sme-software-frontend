import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MD_SPAN_CLASS, XL_SPAN_CLASS } from './form-field.component';

/**
 * Bordered checkbox field (the `.custom--checkbox` pattern) as a
 * `ControlValueAccessor` — bind with `formControlName` directly.
 *
 * Persists the DB-first numeric contract: emits `1` / `0` (SMALLINT flags),
 * and accepts `1/0` or `true/false` when writing.
 *
 * `label` is the field name above the box; `text` is the SHORT affirmative
 * state inside it (top `Status` + inner `Active`) — see CLAUDE.md.
 *
 * ```html
 * <app-check-field label="Status" text="Active" [span]="2" formControlName="is_active" />
 * ```
 */
@Component({
  selector: 'app-check-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCheckboxModule],
  template: `
    @if (label()) {
      <label class="field-label">{{ label() }}</label>
    }
    <div class="custom--checkbox">
      <mat-checkbox
        color="primary"
        [checked]="checked()"
        [disabled]="isDisabled()"
        (change)="onToggle($event.checked)"
      >
        <span class="field-label mb-0 cursor-pointer">{{
          text() || label()
        }}</span>
      </mat-checkbox>
    </div>
  `,
  host: {
    class: 'field-group col-span-12',
    '[class]': 'spanClasses()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckFieldComponent),
      multi: true,
    },
  ],
})
export class CheckFieldComponent implements ControlValueAccessor {
  /** Field name shown above the box (aligns with neighbouring inputs). */
  readonly label = input<string>('');
  /** Short affirmative state inside the box (falls back to `label`). */
  readonly text = input<string>('');
  /** Grid width (of 12) from the `md` breakpoint up. */
  readonly span = input<number>(12);
  /** Optional tighter width from the `xl` breakpoint up. */
  readonly xlSpan = input<number | null>(null);
  /** Emit booleans instead of 1/0 — only for the rare boolean column. */
  readonly emitBoolean = input(false, { transform: booleanAttribute });

  protected readonly checked = signal(false);
  protected readonly isDisabled = signal(false);

  protected readonly spanClasses = computed(() => {
    const md = MD_SPAN_CLASS[this.span()] ?? 'md:col-span-12';
    const xl = this.xlSpan() ? (XL_SPAN_CLASS[this.xlSpan()!] ?? '') : '';
    return `${md} ${xl}`.trim();
  });

  private onChange: (value: number | boolean) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: unknown): void {
    this.checked.set(value === 1 || value === true);
  }
  registerOnChange(fn: (value: number | boolean) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  protected onToggle(checked: boolean): void {
    this.checked.set(checked);
    this.onChange(this.emitBoolean() ? checked : checked ? 1 : 0);
    this.onTouched();
  }
}

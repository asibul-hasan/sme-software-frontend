import { Component, ChangeDetectionStrategy, input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'erp-currency',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ErpCurrencyComponent),
      multi: true,
    },
  ],
  template: `
    <div class="field-group mb-2">
      @if (label()) {
        <label class="form-label font-medium text-slate-700 text-xs mb-1">
          {{ label() }}
          @if (required()) { <span class="text-danger">*</span> }
        </label>
      }
      <div class="input-group input-group-sm">
        <span class="input-group-text bg-light text-muted">{{ symbol() }}</span>
        <input
          type="number"
          class="form-control text-end"
          [class.is-invalid]="errorMessage()"
          [placeholder]="placeholder()"
          [disabled]="disabled || readOnly()"
          [value]="value"
          (input)="onInputChange($event)"
          (blur)="onTouched()"
        />
      </div>
      @if (errorMessage()) {
        <div class="invalid-feedback d-block" style="font-size: 11px">{{ errorMessage() }}</div>
      }
    </div>
  `
})
export class ErpCurrencyComponent implements ControlValueAccessor {
  label = input<string>('');
  placeholder = input<string>('0.00');
  symbol = input<string>('$');
  required = input<boolean>(false);
  readOnly = input<boolean>(false);
  precision = input<number>(2);
  errorMessage = input<string | null>(null);

  value: number | null = null;
  disabled = false;

  onChange: (val: any) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: any): void {
    this.value = val != null ? Number(val) : null;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInputChange(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const num = raw !== '' ? Number(raw) : null;
    this.value = num;
    this.onChange(num);
  }
}

import { Component, ChangeDetectionStrategy, input, output, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'erp-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ErpInputComponent),
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
      <input
        [type]="type()"
        class="form-control form-control-sm"
        [class.is-invalid]="errorMessage()"
        [placeholder]="placeholder()"
        [disabled]="disabled || readOnly()"
        [value]="value"
        (input)="onInputChange($event)"
        (blur)="onTouched()"
      />
      @if (errorMessage()) {
        <div class="invalid-feedback d-block" style="font-size: 11px">{{ errorMessage() }}</div>
      }
    </div>
  `
})
export class ErpInputComponent implements ControlValueAccessor {
  label = input<string>('');
  placeholder = input<string>('');
  type = input<string>('text');
  required = input<boolean>(false);
  readOnly = input<boolean>(false);
  errorMessage = input<string | null>(null);

  value = '';
  disabled = false;

  onChange: (val: any) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: any): void {
    this.value = val ?? '';
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
    const val = (event.target as HTMLInputElement).value;
    this.value = val;
    this.onChange(val);
  }
}

import { Component, ChangeDetectionStrategy, input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

export interface ErpSelectOption {
  value: any;
  label: string;
  data?: any;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'erp-select',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ErpSelectComponent),
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
      <ng-select
        [items]="options()"
        bindLabel="label"
        bindValue="value"
        [placeholder]="placeholder()"
        [clearable]="clearable()"
        [disabled]="disabled || readOnly()"
        [ngModel]="value"
        (ngModelChange)="onSelectionChange($event)"
      ></ng-select>
    </div>
  `
})
export class ErpSelectComponent implements ControlValueAccessor {
  label = input<string>('');
  placeholder = input<string>('Select Option');
  options = input<ErpSelectOption[]>([]);
  required = input<boolean>(false);
  readOnly = input<boolean>(false);
  clearable = input<boolean>(true);

  value: any = null;
  disabled = false;

  onChange: (val: any) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: any): void {
    this.value = val;
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

  onSelectionChange(val: any): void {
    this.value = val;
    this.onChange(val);
    this.onTouched();
  }
}

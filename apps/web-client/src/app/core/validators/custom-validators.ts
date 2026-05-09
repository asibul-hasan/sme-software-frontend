import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  /**
   * Validates that at least one of the specified controls has a value.
   */
  static atLeastOne(fields: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const hasValue = fields.some((field) => {
        const fieldControl = control.get(field);
        return fieldControl && fieldControl.value && fieldControl.value.trim() !== '';
      });

      return hasValue ? null : { atLeastOne: true };
    };
  }

  /**
   * Validates that the value of maxField is greater than or equal to minField.
   * Supports numbers and date strings (yyyy-MM-dd).
   */
  static minMax(minField: string, maxField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const minVal = control.get(minField)?.value;
      const maxVal = control.get(maxField)?.value;

      if (!minVal || !maxVal) {
        return null;
      }

      // If both are numbers
      if (!isNaN(minVal) && !isNaN(maxVal)) {
        return Number(maxVal) >= Number(minVal) ? null : { minMaxMismatch: true };
      }

      // If both are date strings
      const minDate = new Date(minVal);
      const maxDate = new Date(maxVal);
      
      if (!isNaN(minDate.getTime()) && !isNaN(maxDate.getTime())) {
        return maxDate >= minDate ? null : { minMaxMismatch: true };
      }

      return null;
    };
  }
}

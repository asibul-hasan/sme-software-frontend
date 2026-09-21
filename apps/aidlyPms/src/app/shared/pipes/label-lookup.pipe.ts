import { Pipe, PipeTransform } from '@angular/core';
import {
  getOptionLabel,
  LabelOption,
  LabelValueKey,
} from '../constants/label-values.constant';

@Pipe({
  name: 'labelLookup',
  standalone: true,
})
export class LabelLookupPipe implements PipeTransform {
  transform(
    value: number | null | undefined,
    optionsOrKey: readonly LabelOption[] | LabelValueKey,
    fallback = '—'
  ): string {
    return getOptionLabel(optionsOrKey, value, fallback);
  }
}

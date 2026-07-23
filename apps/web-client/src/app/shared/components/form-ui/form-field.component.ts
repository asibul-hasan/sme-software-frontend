import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

/** Static class maps so the Tailwind scanner generates every span variant. */
export const MD_SPAN_CLASS: Record<number, string> = {
  1: 'md:col-span-1',
  2: 'md:col-span-2',
  3: 'md:col-span-3',
  4: 'md:col-span-4',
  5: 'md:col-span-5',
  6: 'md:col-span-6',
  7: 'md:col-span-7',
  8: 'md:col-span-8',
  9: 'md:col-span-9',
  10: 'md:col-span-10',
  11: 'md:col-span-11',
  12: 'md:col-span-12',
};

export const XL_SPAN_CLASS: Record<number, string> = {
  1: 'xl:col-span-1',
  2: 'xl:col-span-2',
  3: 'xl:col-span-3',
  4: 'xl:col-span-4',
  5: 'xl:col-span-5',
  6: 'xl:col-span-6',
  7: 'xl:col-span-7',
  8: 'xl:col-span-8',
  9: 'xl:col-span-9',
  10: 'xl:col-span-10',
  11: 'xl:col-span-11',
  12: 'xl:col-span-12',
};

/**
 * Labeled field wrapper — label + required marker + projected control.
 * Replaces the repeated `.field-group / .field-label` markup.
 *
 * Lives on the section grid: `[span]` = columns of 12 from the `md`
 * breakpoint up (mirrors the old `col-md-*`); `[xlSpan]` refines at `xl`.
 * Validation errors render automatically via `ValidationMessageDirective`
 * on the projected `formControlName` control — nothing to add here.
 *
 * ```html
 * <app-form-field label="Account Code" for="account_code" required [span]="3">
 *   <input id="account_code" formControlName="account_code" class="form-control" />
 * </app-form-field>
 * ```
 */
@Component({
  selector: 'app-form-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatTooltipModule],
  template: `
    @if (label()) {
      <label
        class="field-label"
        [class.required]="required()"
        [attr.for]="controlId() || null"
      >
        {{ label() }}
        @if (info()) {
          <mat-icon class="field-info-icon" [matTooltip]="info()"
            >info_outline</mat-icon
          >
        }
      </label>
    }
    <ng-content />
  `,
  host: {
    class: 'field-group col-span-12',
    '[class]': 'spanClasses()',
  },
})
export class FormFieldComponent {
  /** Field label text; omit for an unlabeled slot that still sits on the grid. */
  readonly label = input<string>('');
  /** `for` attribute of the label — set it to the projected control's `id`. */
  readonly controlId = input<string>('', { alias: 'for' });
  /** Shows the red * marker. Visual only — validators live on the control. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Grid width (of 12) from the `md` breakpoint up. Full width below `md`. */
  readonly span = input<number>(12);
  /** Optional tighter width from the `xl` breakpoint up. */
  readonly xlSpan = input<number | null>(null);
  /** Optional help text — shows an ⓘ icon with a tooltip next to the label. */
  readonly info = input<string>('');

  protected readonly spanClasses = computed(() => {
    const md = MD_SPAN_CLASS[this.span()] ?? 'md:col-span-12';
    const xl = this.xlSpan() ? (XL_SPAN_CLASS[this.xlSpan()!] ?? '') : '';
    return `${md} ${xl}`.trim();
  });
}

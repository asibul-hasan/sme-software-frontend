import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CollapsibleCardDirective } from '../../directives';

/**
 * Standard form section card — the ONLY way to render a titled section
 * inside a form's `[formContent]`.
 *
 * Default body is a 12-column grid: project `<app-form-field>` /
 * `<app-check-field>` children and size them with `[span]`.
 * Pass `flush` for a zero-padding body (tables — `<app-common-table>`).
 *
 * ```html
 * <app-form-section title="Account" icon="menu_book">
 *   <app-form-field label="Code" [span]="3">…</app-form-field>
 * </app-form-section>
 * ```
 *
 * Header extras (buttons, chips) project via `sectionActions`:
 * `<button sectionActions class="btn-action">…</button>`
 */
@Component({
  selector: 'app-form-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, CollapsibleCardDirective],
  template: `
    <section class="form-section-card card">
      <div class="card-header flex items-center justify-between gap-2">
        <h4 class="card-header__title mb-0 flex items-center font-bold">
          @if (icon()) {
            <mat-icon class="mr-2 align-middle">{{ icon() }}</mat-icon>
          }
          {{ title() }}
        </h4>
        <div class="card-header__action">
          <ng-content select="[sectionActions]" />
        </div>
      </div>
      <div [class]="bodyClasses()">
        <ng-content />
      </div>
    </section>
  `,
  host: { class: 'block' },
})
export class FormSectionComponent {
  /** Section heading text. */
  readonly title = input.required<string>();
  /** Material icon shown before the heading. */
  readonly icon = input<string>('');
  /** Zero-padding body without the field grid — for tables (SYS1003 pattern). */
  readonly flush = input(false, { transform: booleanAttribute });

  protected readonly bodyClasses = computed(() =>
    this.flush() ? 'card-body p-0' : 'card-body grid grid-cols-12 gap-2',
  );
}

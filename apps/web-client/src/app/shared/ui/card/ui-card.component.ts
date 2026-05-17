import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

/**
 * Surface container — replaces Bootstrap `.card`.
 *
 * Compose headers / footers with projected content + utilities:
 *
 *   <ui-card [padded]="false">
 *     <div class="px-4 py-3 border-b border-line font-semibold">Title</div>
 *     <div class="p-4">…</div>
 *   </ui-card>
 */
@Component({
  selector: 'ui-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: { '[class]': 'classes()' },
})
export class UiCardComponent {
  /** Apply default inner padding. Set false for headered / edge-to-edge cards. */
  padded = input(true, { transform: booleanAttribute });
  /** Lift slightly on hover — use for clickable cards. */
  interactive = input(false, { transform: booleanAttribute });

  classes = computed(
    () =>
      'block rounded-xl border border-line bg-surface text-content shadow-sm' +
      (this.padded() ? ' p-4' : '') +
      (this.interactive()
        ? ' transition-all duration-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5'
        : ''),
  );
}

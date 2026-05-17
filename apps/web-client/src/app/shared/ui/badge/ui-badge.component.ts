import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type UiBadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

/** Small status pill — replaces Bootstrap `.badge`. */
@Component({
  selector: 'ui-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: { '[class]': 'classes()' },
})
export class UiBadgeComponent {
  variant = input<UiBadgeVariant>('neutral');
  /** Solid fill instead of the default soft tint. */
  solid = input(false, { transform: booleanAttribute });

  private static readonly SOFT: Record<UiBadgeVariant, string> = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
    info: 'bg-info/10 text-info',
    neutral: 'bg-muted text-subtle',
  };

  private static readonly SOLID: Record<UiBadgeVariant, string> = {
    primary: 'bg-primary text-white',
    success: 'bg-success text-white',
    warning: 'bg-warning text-white',
    danger: 'bg-danger text-white',
    info: 'bg-info text-white',
    neutral: 'bg-subtle text-white',
  };

  classes = computed(
    () =>
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 ' +
      'text-xxs font-semibold leading-none whitespace-nowrap ' +
      (this.solid()
        ? UiBadgeComponent.SOLID[this.variant()]
        : UiBadgeComponent.SOFT[this.variant()]),
  );
}

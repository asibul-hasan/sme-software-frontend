import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { UiSpinnerComponent } from '../spinner/ui-spinner.component';

export type UiButtonVariant =
  | 'primary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'secondary'
  | 'ghost';

export type UiButtonSize = 'sm' | 'md';

/**
 * Button primitive. Attribute selector so it decorates a real
 * `<button>`, keeping native type / disabled / form semantics:
 *
 *   <button ui-button variant="success" (click)="save()">Save</button>
 */
@Component({
  selector: 'button[ui-button]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiSpinnerComponent],
  template: `
    @if (loading()) {
      <ui-spinner [size]="size() === 'sm' ? 13 : 15" [thickness]="2" />
    }
    <ng-content />
  `,
  host: {
    '[class]': 'classes()',
    '[disabled]': 'disabled() || loading()',
    '[attr.aria-busy]': 'loading() || null',
  },
})
export class UiButtonComponent {
  variant = input<UiButtonVariant>('primary');
  size = input<UiButtonSize>('md');
  block = input(false, { transform: booleanAttribute });
  loading = input(false, { transform: booleanAttribute });
  disabled = input(false, { transform: booleanAttribute });

  private static readonly BASE =
    'inline-flex items-center justify-center gap-1.5 font-semibold ' +
    'rounded-lg border whitespace-nowrap select-none align-middle ' +
    'transition-all duration-200 cursor-pointer ' +
    'disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40';

  private static readonly SIZES: Record<UiButtonSize, string> = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
  };

  private static readonly VARIANTS: Record<UiButtonVariant, string> = {
    primary:
      'border-transparent text-white bg-indigo shadow-sm hover:brightness-110 active:brightness-95',
    success:
      'border-transparent text-white bg-emerald shadow-sm hover:brightness-110 active:brightness-95',
    danger:
      'border-rose/30 text-rose bg-rose/10 hover:bg-rose/20 active:bg-rose/25',
    warning:
      'border-amber/30 text-amber bg-amber/10 hover:bg-amber/20 active:bg-amber/25',
    secondary:
      'border-line text-content bg-surface hover:bg-muted active:brightness-95',
    ghost:
      'border-transparent text-content bg-transparent hover:bg-muted active:brightness-95',
  };

  classes = computed(
    () =>
      `${UiButtonComponent.BASE} ${UiButtonComponent.SIZES[this.size()]} ` +
      `${UiButtonComponent.VARIANTS[this.variant()]}` +
      (this.block() ? ' w-full' : ''),
  );
}

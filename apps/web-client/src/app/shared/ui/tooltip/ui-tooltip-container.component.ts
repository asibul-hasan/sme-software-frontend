import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Visual container for `UiTooltipDirective`. Created dynamically via
 * a CDK `ComponentPortal` — not used directly in templates.
 */
@Component({
  selector: 'ui-tooltip-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ text() }}`,
  host: { role: 'tooltip' },
  styles: `
    :host {
      display: block;
      max-width: 240px;
      padding: 5px 9px;
      border-radius: 6px;
      background: var(--text-primary);
      color: var(--bg-primary);
      font-size: 11.5px;
      font-weight: 600;
      line-height: 1.35;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
      pointer-events: none;
      animation: ui-tooltip-in 0.12s ease;
    }
    @keyframes ui-tooltip-in {
      from {
        opacity: 0;
        transform: scale(0.96);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `,
})
export class UiTooltipContainerComponent {
  readonly text = input('');
}

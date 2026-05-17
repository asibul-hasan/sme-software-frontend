import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Indeterminate loading spinner. Inherits `currentColor`, so it
 * adopts the color of whatever context it sits in (buttons, overlays).
 */
@Component({
  selector: 'ui-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  host: {
    role: 'progressbar',
    'aria-label': 'Loading',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[style.borderWidth.px]': 'thickness()',
  },
  styles: `
    :host {
      display: inline-block;
      box-sizing: border-box;
      border-style: solid;
      border-color: currentColor;
      border-right-color: transparent;
      border-radius: 9999px;
      animation: ui-spinner-rotate 0.6s linear infinite;
    }
    @keyframes ui-spinner-rotate {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class UiSpinnerComponent {
  size = input<number>(20);
  thickness = input<number>(2);
}

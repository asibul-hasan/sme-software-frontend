import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Icon primitive — renders a Material Icons ligature glyph.
 *
 * Drop-in for the old `<mat-icon>`: the glyph name is projected as
 * content, so `<ui-icon>menu</ui-icon>` mirrors the previous markup.
 * Depends only on the `material-icons` web-font, not `@angular/material`.
 */
@Component({
  selector: 'ui-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    class: 'material-icons',
    'aria-hidden': 'true',
    '[style.font-size.px]': 'size()',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
  },
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      overflow: hidden;
      flex-shrink: 0;
      vertical-align: middle;
      user-select: none;
    }
  `,
})
export class UiIconComponent {
  /** Glyph size in px — drives both font-size and the icon box. */
  size = input<number>(20);
}

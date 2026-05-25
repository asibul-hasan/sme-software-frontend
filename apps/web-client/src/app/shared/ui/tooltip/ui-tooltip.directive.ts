import { Directive, ElementRef, inject, input, OnDestroy } from '@angular/core';
import { ConnectedPosition, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { UiTooltipContainerComponent } from './ui-tooltip-container.component';

export type UiTooltipPosition = 'above' | 'below' | 'left' | 'right';

/**
 * Lightweight tooltip — replaces Material's `matTooltip`.
 *
 *   <button uiTooltip="Save" uiTooltipPosition="above">…</button>
 *
 * Built on CDK Overlay; no `@angular/material` dependency.
 */
@Directive({
  selector: '[uiTooltip]',
  standalone: true,
  host: {
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hide()',
    '(focus)': 'show()',
    '(blur)': 'hide()',
  },
})
export class UiTooltipDirective implements OnDestroy {
  /** Tooltip text. An empty value disables the tooltip. */
  readonly text = input.required<string>({ alias: 'uiTooltip' });
  readonly position = input<UiTooltipPosition>('below', {
    alias: 'uiTooltipPosition',
  });

  private readonly overlay = inject(Overlay);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private overlayRef?: OverlayRef;

  show(): void {
    const label = this.text();
    if (!label || this.overlayRef?.hasAttached()) return;

    this.overlayRef ??= this.overlay.create({
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.host)
        .withPositions([UiTooltipDirective.POSITIONS[this.position()]]),
      scrollStrategy: this.overlay.scrollStrategies.close(),
    });

    const ref = this.overlayRef.attach(
      new ComponentPortal(UiTooltipContainerComponent),
    );
    ref.setInput('text', label);
  }

  hide(): void {
    this.overlayRef?.detach();
  }

  ngOnDestroy(): void {
    this.overlayRef?.dispose();
  }

  private static readonly POSITIONS: Record<
    UiTooltipPosition,
    ConnectedPosition
  > = {
    below: { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 6 },
    above: { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -6 },
    right: { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: 6 },
    left: { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -6 },
  };
}

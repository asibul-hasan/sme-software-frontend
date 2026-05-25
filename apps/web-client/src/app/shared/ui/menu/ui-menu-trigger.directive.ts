import {
  Directive,
  ElementRef,
  inject,
  input,
  OnDestroy,
  ViewContainerRef,
} from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { UiMenuComponent } from './ui-menu.component';

/**
 * Opens a `<ui-menu>` as a CDK overlay anchored to the host element.
 * Replaces Material's `matMenuTriggerFor`.
 */
@Directive({
  selector: '[uiMenuTriggerFor]',
  standalone: true,
  exportAs: 'uiMenuTrigger',
  host: {
    '(click)': 'toggle()',
    '[attr.aria-haspopup]': '"menu"',
    '[attr.aria-expanded]': 'isOpen',
  },
})
export class UiMenuTriggerDirective implements OnDestroy {
  readonly menu = input.required<UiMenuComponent>({ alias: 'uiMenuTriggerFor' });
  /** Horizontal edge of the trigger the panel aligns to. */
  readonly align = input<'start' | 'end'>('start', { alias: 'uiMenuAlign' });

  private readonly overlay = inject(Overlay);
  private readonly vcr = inject(ViewContainerRef);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private overlayRef?: OverlayRef;

  isOpen = false;

  toggle(): void {
    this.isOpen ? this.close() : this.open();
  }

  open(): void {
    if (this.isOpen) return;

    const x = this.align();
    this.overlayRef = this.overlay.create({
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.host)
        .withPositions([
          { originX: x, originY: 'bottom', overlayX: x, overlayY: 'top', offsetY: 6 },
          { originX: x, originY: 'top', overlayX: x, overlayY: 'bottom', offsetY: -6 },
        ]),
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
    });

    this.overlayRef.attach(
      new TemplatePortal(this.menu().templateRef(), this.vcr),
    );
    this.isOpen = true;

    this.overlayRef.backdropClick().subscribe(() => this.close());
    this.overlayRef.keydownEvents().subscribe((e) => {
      if (e.key === 'Escape') this.close();
    });
    // A click that bubbles to the panel root closes the menu — matching
    // mat-menu. Sections that must stay open call $event.stopPropagation().
    this.overlayRef.overlayElement.addEventListener('click', this.onPanelClick);
  }

  close(): void {
    if (!this.isOpen) return;
    this.overlayRef?.dispose();
    this.overlayRef = undefined;
    this.isOpen = false;
  }

  ngOnDestroy(): void {
    this.close();
  }

  private readonly onPanelClick = (): void => this.close();
}

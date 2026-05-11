import {
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  inject,
  signal,
} from '@angular/core';

/**
 * Makes every `.form-section-card` collapsible. Clicking the card header
 * toggles its body open/closed. A chevron indicator is rendered in CSS
 * (see `_form-page.scss`) — no DOM mutation needed here.
 *
 * The selector matches the existing card class, so the directive auto-applies
 * to every existing card in the codebase without changing any template.
 *
 * Click handling intentionally only toggles when the click target is inside
 * the card's `.card-header`. Clicks inside the body (inputs, ng-selects,
 * buttons) never collapse the card.
 */
@Directive({
  selector: '.form-section-card',
  standalone: true,
})
export class CollapsibleCardDirective {
  private readonly host = inject(ElementRef<HTMLElement>);

  private readonly collapsed = signal(false);

  @HostBinding('class.is-collapsible') readonly enabled = true;

  @HostBinding('class.is-collapsed')
  get isCollapsedClass(): boolean {
    return this.collapsed();
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    // Only react if the click started inside this card's own header
    // (avoids toggling when a nested card body is clicked).
    const header = target.closest('.card-header');
    if (!header || !this.host.nativeElement.contains(header)) return;

    // Don't hijack clicks on interactive controls that may live in the header
    // (links, buttons, inputs, ng-select). Without this guard, e.g. a "more"
    // menu in the header would also collapse the card.
    if (target.closest('button, a, input, select, textarea, .ng-select')) {
      return;
    }

    this.collapsed.update((v) => !v);
  }
}

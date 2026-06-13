import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  inject,
  signal,
} from '@angular/core';

/**
 * Makes every `.form-section-card` collapsible.
 *
 * The directive injects a chevron toggle button into the card header. Clicks
 * on that button (and only that button) toggle the collapsed state — clicks
 * anywhere else inside the card are ignored.
 *
 * The click handler is wired via Angular's {@link HostListener} (not a vanilla
 * {@code addEventListener} on the injected button) so the signal update
 * reliably flows through change detection and the host class refreshes
 * immediately.
 *
 * The selector matches the existing card class, so the directive auto-applies
 * to every card in the codebase without changing any template.
 */
@Directive({
  selector: '.form-section-card',
  standalone: true,
})
export class CollapsibleCardDirective implements AfterViewInit {
  private readonly host = inject(ElementRef<HTMLElement>);

  private readonly collapsed = signal(false);

  @HostBinding('class.is-collapsible')
  get enabled(): boolean {
    return !this.host.nativeElement.hasAttribute('data-no-collapse');
  }

  @HostBinding('class.is-collapsed')
  get isCollapsedClass(): boolean {
    return this.enabled && this.collapsed();
  }

  ngAfterViewInit(): void {
    if (this.host.nativeElement.hasAttribute('data-no-collapse')) return;

    const header = this.host.nativeElement.querySelector(
      ':scope > .card-header',
    ) as HTMLElement | null;
    if (!header) return;

    // Idempotent — bail if a toggle was already injected for this header.
    if (header.querySelector(':scope > .card-collapse-toggle')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'card-collapse-toggle';
    button.setAttribute('aria-label', 'Toggle section');
    button.innerHTML =
      '<span class="card-collapse-toggle__chevron" aria-hidden="true"></span>';
    header.appendChild(button);
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (!this.enabled) return;

    const target = event.target as HTMLElement | null;
    if (!target) return;
    const toggle = target.closest('.card-collapse-toggle');
    // Only the chevron toggle button (or its inner chevron span) triggers
    // the collapse — every other click in the card is a no-op. The contains
    // check guards against a nested card's toggle bubbling up to this host.
    if (!toggle || !this.host.nativeElement.contains(toggle)) return;
    event.stopPropagation();
    this.collapsed.update((v) => !v);
  }
}

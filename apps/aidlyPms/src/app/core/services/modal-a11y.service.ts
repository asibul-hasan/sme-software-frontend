import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

@Injectable({
  providedIn: 'root',
})
export class ModalA11yService {
  private readonly platformId = inject(PLATFORM_ID);
  private observer: MutationObserver | null = null;
  private openerStack: HTMLElement[] = [];
  private activeModal: HTMLElement | null = null;

  initialize(): void {
    if (!isPlatformBrowser(this.platformId) || typeof document === 'undefined') {
      return;
    }

    // Attach keydown listener on document for Focus Trap & Escape-to-Close (WCAG 2.2 AA)
    document.addEventListener('keydown', this.handleKeyDown.bind(this), true);

    // Watch for modal opens/closes in document.body
    this.observer = new MutationObserver(this.handleMutations.bind(this));
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    this.checkActiveModals();
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const visibleModal = this.getTopVisibleModal();
    if (!visibleModal) return;

    if (event.key === 'Escape' || event.key === 'Esc') {
      // Escape-to-close WCAG 2.2 AA requirement
      this.closeModal(visibleModal, event);
      return;
    }

    if (event.key === 'Tab') {
      // Focus Trap WCAG 2.2 AA requirement
      this.trapFocus(visibleModal, event);
    }
  }

  private getTopVisibleModal(): HTMLElement | null {
    const modalWraps = Array.from(document.querySelectorAll<HTMLElement>('.ant-modal-wrap, .cdk-overlay-pane'));
    const visibleWraps = modalWraps.filter(w => {
      if (w.style.display === 'none') return false;
      const modal = w.querySelector<HTMLElement>('.ant-modal, [role="dialog"]');
      if (!modal) return false;
      const rect = modal.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    if (visibleWraps.length === 0) return null;
    return visibleWraps[visibleWraps.length - 1];
  }

  private trapFocus(modalWrap: HTMLElement, event: KeyboardEvent): void {
    const dialog = modalWrap.querySelector<HTMLElement>('.ant-modal, [role="dialog"]') || modalWrap;
    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter(el => {
      return el.offsetParent !== null && !el.hasAttribute('disabled') && el.tabIndex !== -1;
    });

    if (focusables.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement;

    if (event.shiftKey) {
      if (active === first || !dialog.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (active === last || !dialog.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  private closeModal(modalWrap: HTMLElement, event: KeyboardEvent): void {
    event.stopPropagation();
    event.preventDefault();

    // Find cancel/close button inside modal
    const closeBtn = modalWrap.querySelector<HTMLElement>(
      '.ant-modal-close, button[aria-label="Close"], .ant-modal-footer button:not(.ant-btn-primary), [nz-button][nzType="default"]'
    );

    if (closeBtn) {
      closeBtn.click();
    } else {
      const backdrop = modalWrap.querySelector<HTMLElement>('.ant-modal-mask') || modalWrap;
      backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }
  }

  private handleMutations(): void {
    this.checkActiveModals();
  }

  private checkActiveModals(): void {
    const topModal = this.getTopVisibleModal();
    if (topModal && topModal !== this.activeModal) {
      // Modal opened
      this.activeModal = topModal;
      const currentOpener = document.activeElement as HTMLElement;
      if (currentOpener && !topModal.contains(currentOpener)) {
        this.openerStack.push(currentOpener);
      }

      // Ensure WCAG AA attributes
      const dialog = topModal.querySelector<HTMLElement>('.ant-modal, .ant-modal-content') || topModal;
      if (!dialog.getAttribute('role')) {
        dialog.setAttribute('role', 'dialog');
      }
      dialog.setAttribute('aria-modal', 'true');

      const titleEl = dialog.querySelector('.ant-modal-title, h1, h2, h3');
      if (titleEl && !dialog.getAttribute('aria-labelledby')) {
        if (!titleEl.id) {
          titleEl.id = `modal-title-${Math.random().toString(36).slice(2, 9)}`;
        }
        dialog.setAttribute('aria-labelledby', titleEl.id);
      }

      // Move focus into the modal
      setTimeout(() => {
        const firstFocusable = dialog.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          dialog.setAttribute('tabindex', '-1');
          dialog.focus();
        }
      }, 50);
    } else if (!topModal && this.activeModal) {
      // Modal closed
      this.activeModal = null;
      const previousOpener = this.openerStack.pop();
      if (previousOpener && typeof previousOpener.focus === 'function') {
        setTimeout(() => previousOpener.focus(), 50);
      }
    }
  }
}

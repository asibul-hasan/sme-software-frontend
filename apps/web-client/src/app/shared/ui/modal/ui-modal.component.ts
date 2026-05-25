import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
} from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { UiIconComponent } from '../icon/ui-icon.component';

/**
 * Modal dialog — replaces `mat-dialog` / Bootstrap `.modal`.
 *
 *   <ui-modal [(open)]="showEdit" title="Edit branch">
 *     …content…
 *   </ui-modal>
 *
 * Renders a fixed, centered panel with a backdrop, focus trap,
 * Escape-to-close and click-outside-to-close.
 */
@Component({
  selector: 'ui-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [A11yModule, UiIconComponent],
  template: `
    @if (open()) {
      <div class="ui-modal-backdrop" (click)="onBackdrop($event)">
        <div
          class="ui-modal-panel"
          [style.max-width.px]="maxWidth()"
          cdkTrapFocus
          [cdkTrapFocusAutoCapture]="true"
          role="dialog"
          aria-modal="true"
        >
          <div class="ui-modal-header">
            <h3 class="ui-modal-title">{{ title() }}</h3>
            <button
              type="button"
              class="ui-modal-close"
              aria-label="Close"
              (click)="dismiss()"
            >
              <ui-icon [size]="20">close</ui-icon>
            </button>
          </div>
          <div class="ui-modal-body">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `,
  host: { '(document:keydown.escape)': 'onEscape()' },
  styles: `
    .ui-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1050;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(2px);
      animation: ui-modal-fade 0.15s ease;
    }
    .ui-modal-panel {
      display: flex;
      flex-direction: column;
      width: 100%;
      max-height: calc(100vh - 40px);
      overflow: hidden;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
      animation: ui-modal-pop 0.16s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .ui-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-shrink: 0;
      padding: 14px 18px;
      border-bottom: 1px solid var(--border-color);
    }
    .ui-modal-title {
      margin: 0;
      font-size: var(--text-xl);
      font-weight: 700;
      color: var(--text-primary);
    }
    .ui-modal-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s;
    }
    .ui-modal-close:hover {
      background: var(--sidebar-hover);
      color: var(--rose);
    }
    .ui-modal-body {
      padding: 18px;
      overflow-y: auto;
    }
    @keyframes ui-modal-fade {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    @keyframes ui-modal-pop {
      from {
        opacity: 0;
        transform: translateY(12px) scale(0.97);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `,
})
export class UiModalComponent {
  /** Two-way open state: `<ui-modal [(open)]="flag">`. */
  readonly open = model(false);
  readonly title = input('');
  readonly maxWidth = input(520);
  readonly closeOnBackdrop = input(true, { transform: booleanAttribute });
  readonly closed = output<void>();

  dismiss(): void {
    this.open.set(false);
    this.closed.emit();
  }

  onEscape(): void {
    if (this.open()) this.dismiss();
  }

  onBackdrop(event: MouseEvent): void {
    if (this.closeOnBackdrop() && event.target === event.currentTarget) {
      this.dismiss();
    }
  }
}

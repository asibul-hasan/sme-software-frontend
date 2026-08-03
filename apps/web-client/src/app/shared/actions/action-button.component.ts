import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AlertService } from '../../core/services/alert.service';
import type { ErpActionKind, ErpActionVariant } from './erp-actions';
import { erpAction, resolveConfirm } from './erp-actions';

/**
 * `<app-action-button>` — a standard ERP action button.
 *
 * <p>Naming the action is enough: icon, label, tooltip, colour and the
 * confirmation prompt all come from the shared catalog, so Delete looks and
 * behaves the same in every module.</p>
 *
 * ```html
 * <app-action-button kind="save"   (run)="save()" [loading]="saving()" />
 * <app-action-button kind="delete" (run)="remove()" />          <!-- confirms automatically -->
 * <app-action-button kind="export" label="Export CSV" iconOnly (run)="exportCsv()" />
 * ```
 *
 * <p>`(run)` fires only AFTER any confirmation is accepted — a handler never has
 * to ask "did they really mean it?" itself.</p>
 */
@Component({
  selector: 'app-action-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatTooltipModule],
  template: `
    <button
      type="button"
      class="erp-action"
      [class]="'erp-action--' + resolvedVariant() + (iconOnly() ? ' erp-action--icon' : '')"
      [disabled]="disabled() || loading()"
      [matTooltip]="resolvedTooltip()"
      [attr.aria-label]="resolvedLabel()"
      (click)="handle()"
    >
      @if (loading()) {
        <span class="erp-action__spinner"></span>
      } @else {
        <mat-icon>{{ resolvedIcon() }}</mat-icon>
      }
      @if (!iconOnly()) {
        <span>{{ resolvedLabel() }}</span>
      }
    </button>
  `,
  styles: [`
    :host { display: inline-flex; }
    .erp-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 34px;
      padding: 0 12px;
      border: 1px solid transparent;
      border-radius: 6px;
      font-size: var(--text-xs, 12px);
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s, color 0.15s, border-color 0.15s, filter 0.15s;
    }
    .erp-action--icon { padding: 0 8px; }
    .erp-action mat-icon { font-size: 17px; width: 17px; height: 17px; }
    .erp-action:disabled { opacity: 0.5; cursor: not-allowed; }

    .erp-action--primary   { background: var(--indigo); color: #fff; }
    .erp-action--primary:hover:not(:disabled)   { filter: brightness(1.1); }
    .erp-action--success   { background: var(--success); color: #fff; }
    .erp-action--success:hover:not(:disabled)   { filter: brightness(1.1); }
    .erp-action--danger    { background: rgba(var(--danger-rgb), 0.12); color: var(--danger); border-color: rgba(var(--danger-rgb), 0.3); }
    .erp-action--danger:hover:not(:disabled)    { background: rgba(var(--danger-rgb), 0.2); }
    .erp-action--warning   { background: rgba(var(--warning-rgb), 0.12); color: var(--warning); border-color: rgba(var(--warning-rgb), 0.3); }
    .erp-action--warning:hover:not(:disabled)   { background: rgba(var(--warning-rgb), 0.2); }
    .erp-action--secondary { background: var(--input-bg); color: var(--text-primary); border-color: var(--border-color); }
    .erp-action--secondary:hover:not(:disabled) { background: var(--bg-secondary); }
    .erp-action--ghost     { background: transparent; color: var(--text-secondary); }
    .erp-action--ghost:hover:not(:disabled)     { background: var(--bg-secondary); color: var(--text-primary); }

    .erp-action__spinner {
      width: 14px; height: 14px;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      animation: erp-action-spin 0.7s linear infinite;
    }
    @keyframes erp-action-spin { to { transform: rotate(360deg); } }
  `],
})
export class ActionButtonComponent {
  private readonly alert = inject(AlertService);

  /** Which standard ERP action this is. Drives icon, label, colour and confirmation. */
  readonly kind = input.required<ErpActionKind>();

  /** Overrides for the catalog defaults. */
  readonly label = input<string>();
  readonly icon = input<string>();
  readonly tooltip = input<string>();
  readonly variant = input<ErpActionVariant>();

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  /** Render the icon only; the label still drives the tooltip and aria-label. */
  readonly iconOnly = input(false, { transform: booleanAttribute });

  /**
   * Confirmation control. Omit for the catalog default (destructive and
   * consequential actions confirm), `false` to suppress, or an object to customise.
   */
  readonly confirm = input<boolean | { title?: string; message?: string; tone?: 'primary' | 'warn' | 'danger' }>();

  /** Fires after confirmation is accepted (or immediately when none is needed). */
  readonly run = output<void>();

  private readonly spec = computed(() => erpAction(this.kind()));

  readonly resolvedIcon = computed(() => this.icon() ?? this.spec().icon);
  readonly resolvedLabel = computed(() => this.label() ?? this.spec().label);
  readonly resolvedVariant = computed(() => this.variant() ?? this.spec().variant);
  readonly resolvedTooltip = computed(
    () => this.tooltip() ?? this.spec().tooltip ?? this.resolvedLabel(),
  );

  handle(): void {
    if (this.disabled() || this.loading()) return;

    const confirm = resolveConfirm(this.kind(), this.confirm());
    if (!confirm) {
      this.run.emit();
      return;
    }
    this.alert
      .confirm(confirm.message, confirm.title, confirm.tone)
      .subscribe((ok) => { if (ok) this.run.emit(); });
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  viewChild,
} from '@angular/core';

/**
 * Dropdown menu panel — replaces Material's `mat-menu`.
 *
 *   <button [uiMenuTriggerFor]="actions">Actions</button>
 *   <ui-menu #actions>
 *     <button class="ui-menu-item">Edit</button>
 *   </ui-menu>
 *
 * The panel lives in an `<ng-template>` and is only stamped into a
 * CDK overlay when `UiMenuTriggerDirective` opens it.
 */
@Component({
  selector: 'ui-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template>
      <div class="ui-menu-panel" role="menu">
        <ng-content />
      </div>
    </ng-template>
  `,
  styles: `
    :host {
      display: none;
    }
    .ui-menu-panel {
      min-width: 200px;
      max-height: 70vh;
      overflow-y: auto;
      padding: 6px 0;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      box-shadow: var(--card-shadow);
      animation: ui-menu-in 0.14s cubic-bezier(0.4, 0, 0.2, 1);
    }
    @keyframes ui-menu-in {
      from {
        opacity: 0;
        transform: translateY(-6px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `,
})
export class UiMenuComponent {
  /** The panel template — stamped into the overlay by the trigger. */
  readonly templateRef = viewChild.required(TemplateRef);
}

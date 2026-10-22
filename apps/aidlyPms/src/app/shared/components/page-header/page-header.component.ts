import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BreadcrumbItem {
  label: string;
  url?: string;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sticky-action-bar flex items-center justify-between gap-3 w-full flex-wrap lg:flex-nowrap">
      <div class="header-filters flex items-center gap-2 flex-wrap">
        <ng-content select="[filters]"></ng-content>
      </div>
      <div class="header-actions flex items-center gap-2 flex-wrap">
        <ng-content select="[actions]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      align-items: center;
      width: 100%;
      min-width: 0;
      max-width: 100%;
      min-height: 44px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 0.375rem 0.875rem;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.04);
      box-sizing: border-box;
      flex-shrink: 0;
    }

    :host:not(:has([actions])):not(:has([filters])) {
      display: none !important;
    }

    :host:not(:has([filters])) .header-filters,
    .header-filters:empty {
      display: none !important;
    }

    .sticky-action-bar {
      width: 100%;
      min-width: 0;
      max-width: 100%;
    }

    .header-filters {
      min-width: 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      min-width: 0;
    }

    :host:has([filters]) .header-actions {
      margin-left: auto;
      flex-shrink: 0;
      justify-content: flex-end;
    }

    :host:not(:has([filters])) .header-actions,
    .header-filters:empty + .header-actions {
      width: 100% !important;
      flex: 1 1 100% !important;
      margin-left: 0 !important;
    }

    /* Wrap slotted filter and action rows on tablet/mobile screens to prevent overflow */
    ::ng-deep .header-filters > [filters],
    ::ng-deep .header-actions > [actions] {
      flex-wrap: wrap !important;
      max-width: 100% !important;
      min-width: 0 !important;
    }
  `],
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() formId?: string;
  @Input() breadcrumbs?: readonly BreadcrumbItem[];
}

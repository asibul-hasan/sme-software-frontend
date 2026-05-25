/**
 * Aidly ERP UI kit — Tailwind-native presentational primitives.
 *
 * Rules: presentational only (no HTTP, router, or feature imports),
 * OnPush, theme-token driven. Spread `UI_KIT` into a module's
 * imports/exports, or import the individual standalone components.
 */
import { UiIconComponent } from './icon/ui-icon.component';
import { UiSpinnerComponent } from './spinner/ui-spinner.component';
import { UiButtonComponent } from './button/ui-button.component';
import { UiCardComponent } from './card/ui-card.component';
import { UiBadgeComponent } from './badge/ui-badge.component';
import { UiTooltipDirective } from './tooltip/ui-tooltip.directive';
import { UiMenuComponent } from './menu/ui-menu.component';
import { UiMenuTriggerDirective } from './menu/ui-menu-trigger.directive';
import { UiCheckboxComponent } from './checkbox/ui-checkbox.component';
import { UiInputComponent } from './input/ui-input.component';
import { UiSelectComponent } from './select/ui-select.component';
import { UiDatepickerComponent } from './datepicker/ui-datepicker.component';
import { UiModalComponent } from './modal/ui-modal.component';

export * from './icon/ui-icon.component';
export * from './spinner/ui-spinner.component';
export * from './button/ui-button.component';
export * from './card/ui-card.component';
export * from './badge/ui-badge.component';
export * from './tooltip/ui-tooltip.directive';
export * from './tooltip/ui-tooltip-container.component';
export * from './menu/ui-menu.component';
export * from './menu/ui-menu-trigger.directive';
export * from './checkbox/ui-checkbox.component';
export * from './input/ui-input.component';
export * from './select/ui-select.component';
export * from './datepicker/ui-datepicker.component';
export * from './modal/ui-modal.component';

/** Every UI-kit primitive — spread into a module's imports/exports. */
export const UI_KIT = [
  UiIconComponent,
  UiSpinnerComponent,
  UiButtonComponent,
  UiCardComponent,
  UiBadgeComponent,
  UiTooltipDirective,
  UiMenuComponent,
  UiMenuTriggerDirective,
  UiCheckboxComponent,
  UiInputComponent,
  UiSelectComponent,
  UiDatepickerComponent,
  UiModalComponent,
] as const;

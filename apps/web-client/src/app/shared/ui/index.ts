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

export * from './icon/ui-icon.component';
export * from './spinner/ui-spinner.component';
export * from './button/ui-button.component';
export * from './card/ui-card.component';
export * from './badge/ui-badge.component';

/** Every UI-kit primitive — spread into a module's imports/exports. */
export const UI_KIT = [
  UiIconComponent,
  UiSpinnerComponent,
  UiButtonComponent,
  UiCardComponent,
  UiBadgeComponent,
] as const;

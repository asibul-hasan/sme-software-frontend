/**
 * Form-UI building blocks — the standard vocabulary for every ERP form.
 *
 * Page shell:       <app-page-form-layout>   (header, actions, sidebar, content)
 * Section card:     <app-form-section>       (title + icon + 12-col field grid)
 * Labeled field:    <app-form-field>         (label, required *, [span] width)
 * Checkbox field:   <app-check-field>        (bordered checkbox, 1/0 CVA)
 *
 * Forms write ZERO css — styling comes from these components, the global
 * form classes, and Tailwind utilities. See aidly-business-doc/frontend/
 * form-design-standard.md for the full standard.
 */
import { FormSectionComponent } from './form-section.component';
import { FormFieldComponent } from './form-field.component';
import { CheckFieldComponent } from './check-field.component';

export * from './form-section.component';
export * from './form-field.component';
export * from './check-field.component';

/** Spread into imports/exports — every form gets these via SharedModule. */
export const FORM_UI = [
  FormSectionComponent,
  FormFieldComponent,
  CheckFieldComponent,
] as const;

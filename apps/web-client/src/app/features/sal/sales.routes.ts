import { Routes } from '@angular/router';

/**
 * SAL module routes.
 * Pattern: {type}/{form-name-slug}  →  full URL: /sal/{type}/{slug}
 * All components pending — uncomment when built.
 */
export const SALES_ROUTES: Routes = [
  // ── POS ───────────────────────────────────────────────────────────────────
  // SAL_1001 — component not yet built
  // {
  //   path: 'form/pos-sales-screen',
  //   loadComponent: () =>
  //     import('./forms/sal1001/sal1001.component').then((m) => m.Sal1001Component),
  // },
  // SAL_1002 — component not yet built
  // {
  //   path: 'form/draft-hold-sales',
  //   loadComponent: () =>
  //     import('./forms/sal1002/sal1002.component').then((m) => m.Sal1002Component),
  // },
  // SAL_1003 — component not yet built
  // {
  //   path: 'form/pos-closing',
  //   loadComponent: () =>
  //     import('./forms/sal1003/sal1003.component').then((m) => m.Sal1003Component),
  // },

  // ── Customer ──────────────────────────────────────────────────────────────
  // SAL_1101 — component not yet built
  // {
  //   path: 'form/customer-management',
  //   loadComponent: () =>
  //     import('./forms/sal1101/sal1101.component').then((m) => m.Sal1101Component),
  // },
  // SAL_1102 — component not yet built
  // {
  //   path: 'form/customer-due-collection',
  //   loadComponent: () =>
  //     import('./forms/sal1102/sal1102.component').then((m) => m.Sal1102Component),
  // },
];

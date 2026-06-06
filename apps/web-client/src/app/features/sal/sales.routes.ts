import { Routes } from '@angular/router';

/**
 * SAL module routes. Pattern: {type}/{slug} → /sal/{type}/{slug}.
 */
export const SALES_ROUTES: Routes = [
  // ── Masters ───────────────────────────────────────────────────────────────
  {
    path: 'form/customer-management',
    loadComponent: () => import('./forms/sal1101/sal1101.component').then((m) => m.Sal1101Component),
  },

  // ── Sales Workflow ────────────────────────────────────────────────────────
  {
    path: 'form/sales-invoice',
    loadComponent: () => import('./forms/sal1001/sal1001.component').then((m) => m.Sal1001Component),
  },
  {
    path: 'form/customer-receipt',
    loadComponent: () => import('./forms/sal1102/sal1102.component').then((m) => m.Sal1102Component),
  },
  {
    path: 'form/sales-return',
    loadComponent: () => import('./forms/sal1103/sal1103.component').then((m) => m.Sal1103Component),
  },
];

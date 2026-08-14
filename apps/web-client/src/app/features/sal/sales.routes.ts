import { Routes } from '@angular/router';

/**
 * SAL module routes. Pattern: {type}/{slug} → /sal/{type}/{slug}.
 */
export const SALES_ROUTES: Routes = [
  // ── POS ───────────────────────────────────────────────────────────────────
  // Full-screen till, deliberately outside the form/ convention: it takes the
  // whole viewport rather than sitting inside the page shell.
  {
    path: 'pos',
    loadComponent: () => import('./pages/pos/pos.component').then((m) => m.PosComponent),
  },

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
    path: 'form/pos-closing',
    loadComponent: () => import('./forms/sal1003/sal1003.component').then((m) => m.Sal1003Component),
  },
  {
    path: 'form/pos-terminal',
    loadComponent: () => import('./forms/sal1005/sal1005.component').then((m) => m.Sal1005Component),
  },
  {
    path: 'form/promotions',
    loadComponent: () => import('./forms/sal1104/sal1104.component').then((m) => m.Sal1104Component),
  },

  // ── Reports ───────────────────────────────────────────────────────────────
  {
    path: 'report/sales',
    loadComponent: () => import('./reports/sal1301/sal1301.component').then((m) => m.Sal1301Component),
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

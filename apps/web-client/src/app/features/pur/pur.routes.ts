import { Routes } from '@angular/router';

/**
 * PUR module routes. Pattern: {type}/{slug} → /pur/{type}/{slug}.
 */
export const PUR_ROUTES: Routes = [
  // ── Masters ───────────────────────────────────────────────────────────────
  {
    path: 'form/supplier-management',
    loadComponent: () => import('./forms/pur1001/pur1001.component').then((m) => m.Pur1001Component),
  },

  // ── Purchase Workflow ─────────────────────────────────────────────────────
  {
    path: 'form/supplier-price-list',
    loadComponent: () => import('./forms/pur1002/pur1002.component').then((m) => m.Pur1002Component),
  },
  {
    path: 'form/purchase-order',
    loadComponent: () => import('./forms/pur1101/pur1101.component').then((m) => m.Pur1101Component),
  },

  // ── Purchase Workflow ─────────────────────────────────────────────────────
  {
    path: 'form/purchase-invoice',
    loadComponent: () => import('./forms/pur1102/pur1102.component').then((m) => m.Pur1102Component),
  },
  {
    path: 'form/goods-receipt-note',
    loadComponent: () => import('./forms/pur1105/pur1105.component').then((m) => m.Pur1105Component),
  },
  {
    path: 'form/landed-cost',
    loadComponent: () => import('./forms/pur1106/pur1106.component').then((m) => m.Pur1106Component),
  },
  {
    path: 'form/purchase-return',
    loadComponent: () => import('./forms/pur1103/pur1103.component').then((m) => m.Pur1103Component),
  },
  {
    path: 'report/aging-spend',
    loadComponent: () => import('./reports/pur1301/pur1301.component').then((m) => m.Pur1301Component),
  },
  {
    path: 'form/supplier-payment',
    loadComponent: () => import('./forms/pur1104/pur1104.component').then((m) => m.Pur1104Component),
  },
  // form/purchase-order — later wave
];

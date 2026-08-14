import { Routes } from '@angular/router';

/**
 * INV module routes.
 * Pattern: {type}/{form-name-slug}  →  full URL: /inv/{type}/{slug}
 */
export const INVENTORY_ROUTES: Routes = [
  // ── Product Management ────────────────────────────────────────────────────
  {
    path: 'form/product-master-setup',
    loadComponent: () =>
      import('./forms/inv1001/inv1001.component').then((m) => m.Inv1001Component),
  },
  {
    path: 'form/barcode-generator',
    loadComponent: () =>
      import('./forms/inv1002/inv1002.component').then((m) => m.Inv1002Component),
  },
  {
    path: 'form/category-setup',
    loadComponent: () =>
      import('./forms/inv1003/inv1003.component').then((m) => m.Inv1003Component),
  },
  {
    path: 'form/brand-setup',
    loadComponent: () =>
      import('./forms/inv1004/inv1004.component').then((m) => m.Inv1004Component),
  },
  {
    path: 'form/unit-of-measure-setup',
    loadComponent: () =>
      import('./forms/inv1005/inv1005.component').then((m) => m.Inv1005Component),
  },
  {
    path: 'form/product-attribute-setup',
    loadComponent: () =>
      import('./forms/inv1006/inv1006.component').then((m) => m.Inv1006Component),
  },

  // ── Stock Initialization ──────────────────────────────────────────────────
  {
    path: 'form/opening-stock-entry',
    loadComponent: () =>
      import('./forms/inv1101/inv1101.component').then((m) => m.Inv1101Component),
  },
  {
    path: 'form/stock-adjustment',
    loadComponent: () =>
      import('./forms/inv1102/inv1102.component').then((m) => m.Inv1102Component),
  },

  // ── Warehouse ─────────────────────────────────────────────────────────────
  {
    path: 'form/warehouse-setup',
    loadComponent: () =>
      import('./forms/inv2001/inv2001.component').then((m) => m.Inv2001Component),
  },
  {
    path: 'form/rack-shelf-setup',
    loadComponent: () =>
      import('./forms/inv2002/inv2002.component').then((m) => m.Inv2002Component),
  },

  // ── Stock Transfer ────────────────────────────────────────────────────────
  {
    path: 'form/stock-transfer',
    loadComponent: () =>
      import('./forms/inv2003/inv2003.component').then((m) => m.Inv2003Component),
  },

  // ── Batch Control ─────────────────────────────────────────────────────────
  {
    path: 'form/batch-expiry-management',
    loadComponent: () =>
      import('./forms/inv2004/inv2004.component').then((m) => m.Inv2004Component),
  },

  // ── Reorder Control ───────────────────────────────────────────────────────
  {
    path: 'form/reorder-level-setup',
    loadComponent: () =>
      import('./forms/inv2005/inv2005.component').then((m) => m.Inv2005Component),
  },
  {
    path: 'form/physical-count',
    loadComponent: () =>
      import('./forms/inv2006/inv2006.component').then((m) => m.Inv2006Component),
  },
];

import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  {
    path: 'form/company-setup',
    loadComponent: () =>
      import('./forms/sys1001/sys1001.component').then((m) => m.Sys1001Component),
  },
  {
    path: 'form/branch-setup',
    loadComponent: () =>
      import('./forms/sys1002/sys1002.component').then((m) => m.Sys1002Component),
  },
  {
    path: 'form/financial-year-setup',
    loadComponent: () =>
      import('./forms/sys1003/sys1003.component').then((m) => m.Sys1003Component),
  },
  {
    path: 'form/currency-setup',
    loadComponent: () =>
      import('./forms/sys1004/sys1004.component').then((m) => m.Sys1004Component),
  },
  {
    path: 'form/vat-tax-setup',
    loadComponent: () =>
      import('./forms/sys1005/sys1005.component').then((m) => m.Sys1005Component),
  },
];

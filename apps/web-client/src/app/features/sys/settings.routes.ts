import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  {
    path: 'form/company-setup',
    loadComponent: () =>
      import('./forms/sys1001/sys1001.component').then(
        (m) => m.Sys1001Component,
      ),
  },
  {
    path: 'form/branch-setup',
    loadComponent: () =>
      import('./forms/sys1002/sys1002.component').then(
        (m) => m.Sys1002Component,
      ),
  },
  {
    path: 'form/financial-year-setup',
    loadComponent: () =>
      import('./forms/sys1003/sys1003.component').then(
        (m) => m.Sys1003Component,
      ),
  },
  {
    path: 'form/currency-setup',
    loadComponent: () =>
      import('./forms/sys1004/sys1004.component').then(
        (m) => m.Sys1004Component,
      ),
  },
  {
    path: 'form/vat-tax-setup',
    loadComponent: () =>
      import('./forms/sys1005/sys1005.component').then(
        (m) => m.Sys1005Component,
      ),
  },
  {
    path: 'form/user-management',
    loadComponent: () =>
      import('./forms/sys1101/sys1101.component').then(
        (m) => m.Sys1101Component,
      ),
  },
  {
    path: 'form/role-management',
    loadComponent: () =>
      import('./forms/sys1102/sys1102.component').then(
        (m) => m.Sys1102Component,
      ),
  },
  {
    path: 'form/role-permission-matrix',
    loadComponent: () =>
      import('./forms/sys1103/sys1103.component').then(
        (m) => m.Sys1103Component,
      ),
  },
  {
    path: 'form/user-branch-mapping',
    loadComponent: () =>
      import('./forms/sys1104/sys1104.component').then(
        (m) => m.Sys1104Component,
      ),
  },
  {
    path: 'form/exchange-rate-setup',
    loadComponent: () =>
      import('./forms/sys1006/sys1006.component').then((m) => m.Sys1006Component),
  },
  {
    path: 'form/cost-center-setup',
    loadComponent: () =>
      import('./forms/sys1007/sys1007.component').then((m) => m.Sys1007Component),
  },
  {
    path: 'form/system-settings',
    loadComponent: () =>
      import('./forms/sys1008/sys1008.component').then((m) => m.Sys1008Component),
  },
  {
    path: 'form/activity-log',
    loadComponent: () =>
      import('./forms/sys1105/sys1105.component').then((m) => m.Sys1105Component),
  },
  {
    path: 'form/approval-workflow-setup',
    loadComponent: () =>
      import('./forms/sys1108/sys1108.component').then((m) => m.Sys1108Component),
  },
  {
    path: 'form/user-company-mapping',
    loadComponent: () =>
      import('./forms/sys1107/sys1107.component').then((m) => m.Sys1107Component),
  },
  {
    path: 'form/session-monitor',
    loadComponent: () =>
      import('./forms/sys1109/sys1109.component').then((m) => m.Sys1109Component),
  },
  {
    path: 'form/menu-enrollment',
    loadComponent: () =>
      import('./forms/sys1202/sys1202.component').then((m) => m.Sys1202Component),
  },
  {
    path: 'form/file-manager',
    loadComponent: () =>
      import('./forms/sys1203/sys1203.component').then((m) => m.Sys1203Component),
  },
  {
    path: 'form/menu-builder',
    loadComponent: () =>
      import('./forms/sys1201/sys1201.component').then((m) => m.Sys1201Component),
  },

  {
    path: 'user-management',
    loadComponent: () =>
      import('./forms/sys1101/sys1101.component').then(
        (m) => m.Sys1101Component,
      ),
  },
];

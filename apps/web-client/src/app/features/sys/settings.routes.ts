import { Routes } from '@angular/router';
export const SETTINGS_ROUTES: Routes = [
  {
    path: 'form/company-branch-setup',
    // path: 'form/sys_1001',
    loadComponent: () =>
      import('./forms/sys1001/sys1001.component').then(
        (m) => m.Sys1001Component,
      ),
  },
];

import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./home/dashboard-home.component').then(
        (m) => m.DashboardHomeComponent
      ),
  },
];

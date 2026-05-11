import { Routes } from '@angular/router';

export const HR_ROUTES: Routes = [
  {
    path: 'form/employee-management',
    loadComponent: () =>
      import('./forms/hr1001/hr1001.component').then((m) => m.Hr1001Component),
  },
  {
    path: 'form/department-designation-setup',
    loadComponent: () =>
      import('./forms/hr1002/hr1002.component').then((m) => m.Hr1002Component),
  },
];

import { Routes } from '@angular/router';

export const INVENTORY_ROUTES: Routes = [
  {
    path: 'forms/inv1001',
    loadComponent: () =>
      import('./forms/inv1001/inv1001.component').then((m) => m.Inv1001Component),
  },
  {
    path: 'forms/inv1002',
    loadComponent: () =>
      import('./forms/inv1002/inv1002.component').then((m) => m.Inv1002Component),
  },
  {
    path: 'forms/inv1003',
    loadComponent: () =>
      import('./forms/inv1003/inv1003.component').then((m) => m.Inv1003Component),
  },
  {
    path: 'forms/inv1006',
    loadComponent: () =>
      import('./forms/inv1006/inv1006.component').then((m) => m.Inv1006Component),
  },
  {
    path: 'forms/inv1004',
    loadComponent: () =>
      import('./forms/inv1004/inv1004.component').then((m) => m.Inv1004Component),
  },
  {
    path: 'forms/inv1005',
    loadComponent: () =>
      import('./forms/inv1005/inv1005.component').then((m) => m.Inv1005Component),
  },
  {
    path: 'forms/inv1101',
    loadComponent: () =>
      import('./forms/inv1101/inv1101.component').then((m) => m.Inv1101Component),
  },
  {
    path: 'forms/inv1102',
    loadComponent: () =>
      import('./forms/inv1102/inv1102.component').then((m) => m.Inv1102Component),
  },
  {
    path: 'forms/inv2001',
    loadComponent: () =>
      import('./forms/inv2001/inv2001.component').then((m) => m.Inv2001Component),
  },
  {
    path: 'forms/inv2002',
    loadComponent: () =>
      import('./forms/inv2002/inv2002.component').then((m) => m.Inv2002Component),
  },
  {
    path: 'forms/inv2003',
    loadComponent: () =>
      import('./forms/inv2003/inv2003.component').then((m) => m.Inv2003Component),
  },
  {
    path: 'forms/inv2005',
    loadComponent: () =>
      import('./forms/inv2005/inv2005.component').then((m) => m.Inv2005Component),
  },
];

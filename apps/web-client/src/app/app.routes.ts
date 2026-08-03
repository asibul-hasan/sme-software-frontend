import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';

/**
 * Top-level route table.
 *
 * Module routes (sys, hr, inv, sal, pur, fin, rpt) are lazy-loaded under the
 * authenticated `MainLayoutComponent`. Each module owns its own `*.routes.ts`
 * so we never have a single mega-route file.
 */
export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
      },
    ],
  },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then(
            (m) => m.DASHBOARD_ROUTES,
          ),
      },
      {
        path: 'grid-demo',
        loadComponent: () =>
          import('./features/demo/grid-demo.component').then(
            (m) => m.GridDemoComponent,
          ),
      },
      {
        path: 'grid-showcase',
        loadComponent: () =>
          import('./shared/ag-grid/grid-showcase.component').then(
            (m) => m.GridShowcaseComponent,
          ),
      },
      {
        path: 'sys',
        loadChildren: () =>
          import('./features/sys/settings.routes').then(
            (m) => m.SETTINGS_ROUTES,
          ),
      },
      {
        path: 'hrm',
        loadChildren: () =>
          import('./features/hrm/hrm.routes').then((m) => m.HRM_ROUTES),
      },
      {
        path: 'inv',
        loadChildren: () =>
          import('./features/inv/inventory.routes').then(
            (m) => m.INVENTORY_ROUTES,
          ),
      },
      {
        path: 'sal',
        loadChildren: () =>
          import('./features/sal/sales.routes').then((m) => m.SALES_ROUTES),
      },
      {
        path: 'pur',
        loadChildren: () =>
          import('./features/pur/pur.routes').then((m) => m.PUR_ROUTES),
      },
      {
        path: 'fin',
        loadChildren: () =>
          import('./features/fin/fin.routes').then((m) => m.FIN_ROUTES),
      },
    ],
  },

  { path: '**', redirectTo: 'dashboard' },
];

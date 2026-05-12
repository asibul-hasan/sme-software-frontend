import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
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
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then(
            (m) => m.DASHBOARD_ROUTES,
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
        path: 'user-management',
        loadComponent: () =>
          import('./features/sys/forms/sys1101/sys1101.component').then(
            (m) => m.Sys1101Component,
          ),
      },
      {
        path: 'hr',
        loadChildren: () =>
          import('./features/hr/hr.routes').then((m) => m.HR_ROUTES),
      },
      // Module placeholders — each module's `routes.ts` registers its
      // own forms/reports as the modules come online. Removing one of
      // these without first removing the matching menu items from the
      // backend will turn the sidebar into a stream of 404s.
      // {
      //   path: 'hr',
      //   loadChildren: () =>
      //     import('./features/hr/hr.routes').then((m) => m.HR_ROUTES),
      // },
      // {
      //   path: 'inv',
      //   loadChildren: () =>
      //     import('./features/inv/inventory.routes').then((m) => m.INVENTORY_ROUTES),
      // },
      // {
      //   path: 'sal',
      //   loadChildren: () =>
      //     import('./features/sal/sales.routes').then((m) => m.SALES_ROUTES),
      // },
    ],
  },

  { path: '**', redirectTo: 'dashboard' },
];

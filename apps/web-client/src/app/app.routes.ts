import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
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
      // {
      //   path: 'hr',
      //   loadChildren: () =>
      //     import('./features/hr/hr.routes').then((m) => m.HR_ROUTES),
      // },
      {
        path: 'sys',
        loadChildren: () =>
          import('./features/sys/settings.routes').then(
            (m) => m.SETTINGS_ROUTES,
          ),
      },
      // Add more protected routes here
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];

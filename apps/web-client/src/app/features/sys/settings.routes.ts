import { Routes } from '@angular/router';

/**
 * SYS module routes.
 * Pattern: {type}/{form-name-slug}  →  full URL: /sys/{type}/{slug}
 */
export const SETTINGS_ROUTES: Routes = [
  // ── Organization Setup ────────────────────────────────────────────────────
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

  // ── User & Security ───────────────────────────────────────────────────────
  {
    path: 'form/user-management',
    loadComponent: () =>
      import('./forms/sys1101/sys1101.component').then((m) => m.Sys1101Component),
  },
  {
    path: 'form/role-management',
    loadComponent: () =>
      import('./forms/sys1102/sys1102.component').then((m) => m.Sys1102Component),
  },
  {
    path: 'report/role-permission-matrix',
    loadComponent: () =>
      import('./forms/sys1103/sys1103.component').then((m) => m.Sys1103Component),
  },
  {
    path: 'form/user-branch-mapping',
    loadComponent: () =>
      import('./forms/sys1104/sys1104.component').then((m) => m.Sys1104Component),
  },
  {
    path: 'report/activity-log-viewer',
    loadComponent: () =>
      import('./forms/sys1105/sys1105.component').then((m) => m.Sys1105Component),
  },
  // SYS_1106 — component not yet built
  // {
  //   path: 'form/user-warehouse-mapping',
  //   loadComponent: () =>
  //     import('./forms/sys1106/sys1106.component').then((m) => m.Sys1106Component),
  // },
  {
    path: 'form/user-company-mapping',
    loadComponent: () =>
      import('./forms/sys1107/sys1107.component').then((m) => m.Sys1107Component),
  },
  {
    path: 'form/approval-workflow-setup',
    loadComponent: () =>
      import('./forms/sys1108/sys1108.component').then((m) => m.Sys1108Component),
  },
  {
    path: 'form/approval-inbox',
    loadComponent: () =>
      import('./forms/approval-inbox/approval-inbox.component').then((m) => m.ApprovalInboxComponent),
  },
  {
    path: 'form/session-login-monitor',
    loadComponent: () =>
      import('./forms/sys1109/sys1109.component').then((m) => m.Sys1109Component),
  },

  // ── Configuration ─────────────────────────────────────────────────────────
  {
    path: 'form/dynamic-menu-builder',
    loadComponent: () =>
      import('./forms/sys1201/sys1201.component').then((m) => m.Sys1201Component),
  },
  // Backward-compatible aliases used by older SYS menu seeds. The sidebar
  // follows sys_menu.route_path, so these must continue to resolve while
  // existing installations migrate to the friendly route above.
  {
    path: 'forms/sys1201',
    redirectTo: 'form/dynamic-menu-builder',
    pathMatch: 'full',
  },
  {
    path: 'form/sys1201',
    redirectTo: 'form/dynamic-menu-builder',
    pathMatch: 'full',
  },
  {
    path: 'form/menu-enrollment',
    loadComponent: () =>
      import('./forms/sys1202/sys1202.component').then((m) => m.Sys1202Component),
  },
  {
    path: 'form/file-image-manager',
    loadComponent: () =>
      import('./forms/sys1203/sys1203.component').then((m) => m.Sys1203Component),
  },
  {
    path: 'form/id-generator',
    loadComponent: () =>
      import('./forms/sys1301/sys1301.component').then((m) => m.Sys1301Component),
  },
];

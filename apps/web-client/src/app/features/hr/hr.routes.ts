import { Routes } from '@angular/router';

/**
 * HR module routes.
 * Pattern: {type}/{form-name-slug}  →  full URL: /hr/{type}/{slug}
 */
export const HR_ROUTES: Routes = [
  // ── Employee Setup ────────────────────────────────────────────────────────
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
  {
    path: 'form/grade-setup',
    loadComponent: () =>
      import('./forms/hr1004/hr1004.component').then((m) => m.Hr1004Component),
  },
  // HR_1003 — component not yet built
  // {
  //   path: 'form/shift-setup',
  //   loadComponent: () =>
  //     import('./forms/hr1003/hr1003.component').then((m) => m.Hr1003Component),
  // },

  // ── Attendance ────────────────────────────────────────────────────────────
  // HR_1101 — component not yet built
  // {
  //   path: 'form/manual-attendance',
  //   loadComponent: () =>
  //     import('./forms/hr1101/hr1101.component').then((m) => m.Hr1101Component),
  // },
  // HR_1102 — component not yet built
  // {
  //   path: 'form/device-sync-attendance',
  //   loadComponent: () =>
  //     import('./forms/hr1102/hr1102.component').then((m) => m.Hr1102Component),
  // },
  // HR_1103 — component not yet built
  // {
  //   path: 'form/attendance-adjustment',
  //   loadComponent: () =>
  //     import('./forms/hr1103/hr1103.component').then((m) => m.Hr1103Component),
  // },

  // ── Payroll ───────────────────────────────────────────────────────────────
  // HR_1201 — component not yet built
  // {
  //   path: 'form/salary-structure-setup',
  //   loadComponent: () =>
  //     import('./forms/hr1201/hr1201.component').then((m) => m.Hr1201Component),
  // },
  // HR_1202 — component not yet built
  // {
  //   path: 'form/salary-processing',
  //   loadComponent: () =>
  //     import('./forms/hr1202/hr1202.component').then((m) => m.Hr1202Component),
  // },
  // HR_1203 — component not yet built
  // {
  //   path: 'report/salary-sheet',
  //   loadComponent: () =>
  //     import('./forms/hr1203/hr1203.component').then((m) => m.Hr1203Component),
  // },
  // HR_1204 — component not yet built
  // {
  //   path: 'report/payslip-generator',
  //   loadComponent: () =>
  //     import('./forms/hr1204/hr1204.component').then((m) => m.Hr1204Component),
  // },
];

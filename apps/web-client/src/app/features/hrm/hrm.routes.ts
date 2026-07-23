import { Routes } from '@angular/router';

/**
 * HR module routes.
 * Pattern: {type}/{form-name-slug}  →  full URL: /hrm/{type}/{slug}
 */
export const HRM_ROUTES: Routes = [
  // ── Employee Setup ────────────────────────────────────────────────────────
  {
    path: 'form/employee-management',
    loadComponent: () =>
      import('./forms/hrm1001/hrm1001.component').then((m) => m.Hrm1001Component),
  },
  {
    path: 'form/department-designation-setup',
    loadComponent: () =>
      import('./forms/hrm1002/hrm1002.component').then((m) => m.Hrm1002Component),
  },
  {
    path: 'form/grade-setup',
    loadComponent: () =>
      import('./forms/hrm1004/hrm1004.component').then((m) => m.Hrm1004Component),
  },
  {
    path: 'form/shift-setup',
    loadComponent: () =>
      import('./forms/hrm1003/hrm1003.component').then((m) => m.Hrm1003Component),
  },
  {
    path: 'form/leave-type-setup',
    loadComponent: () =>
      import('./forms/hrm1005/hrm1005.component').then((m) => m.Hrm1005Component),
  },
  {
    path: 'form/salary-component-setup',
    loadComponent: () =>
      import('./forms/hrm1007/hrm1007.component').then((m) => m.Hrm1007Component),
  },
  {
    path: 'form/holiday-calendar',
    loadComponent: () =>
      import('./forms/hrm1006/hrm1006.component').then((m) => m.Hrm1006Component),
  },
  {
    path: 'form/hr-settings',
    loadComponent: () =>
      import('./forms/hrm1008/hrm1008.component').then((m) => m.Hrm1008Component),
  },
  {
    path: 'form/tax-slab-setup',
    loadComponent: () =>
      import('./forms/hrm1009/hrm1009.component').then((m) => m.Hrm1009Component),
  },
  {
    path: 'form/manual-attendance',
    loadComponent: () =>
      import('./forms/hrm1101/hrm1101.component').then((m) => m.Hrm1101Component),
  },
  {
    path: 'form/salary-structure-setup',
    loadComponent: () =>
      import('./forms/hrm1201/hrm1201.component').then((m) => m.Hrm1201Component),
  },
  {
    path: 'form/leave-application',
    loadComponent: () =>
      import('./forms/hrm1301/hrm1301.component').then((m) => m.Hrm1301Component),
  },
  {
    path: 'form/leave-approval',
    loadComponent: () =>
      import('./forms/hrm1321/hrm1321.component').then((m) => m.Hrm1321Component),
  },
  {
    path: 'form/salary-processing',
    loadComponent: () =>
      import('./forms/hrm1202/hrm1202.component').then((m) => m.Hrm1202Component),
  },
  {
    path: 'form/attendance-adjustment',
    loadComponent: () =>
      import('./forms/hrm1103/hrm1103.component').then((m) => m.Hrm1103Component),
  },
  {
    path: 'form/job-requisition',
    loadComponent: () =>
      import('./forms/hrm1401/hrm1401.component').then((m) => m.Hrm1401Component),
  },
  {
    path: 'form/candidate',
    loadComponent: () =>
      import('./forms/hrm1402/hrm1402.component').then((m) => m.Hrm1402Component),
  },
  {
    path: 'form/offer-onboarding',
    loadComponent: () =>
      import('./forms/hrm1404/hrm1404.component').then((m) => m.Hrm1404Component),
  },
  {
    path: 'form/promotion-transfer',
    loadComponent: () =>
      import('./forms/hrm1106/hrm1106.component').then((m) => m.Hrm1106Component),
  },
  {
    path: 'form/final-settlement',
    loadComponent: () =>
      import('./forms/hrm1207/hrm1207.component').then((m) => m.Hrm1207Component),
  },
  {
    path: 'form/loan-advance',
    loadComponent: () =>
      import('./forms/hrm1206/hrm1206.component').then((m) => m.Hrm1206Component),
  },
  {
    path: 'form/bonus-festival',
    loadComponent: () =>
      import('./forms/hrm1205/hrm1205.component').then((m) => m.Hrm1205Component),
  },
  {
    path: 'form/overtime',
    loadComponent: () =>
      import('./forms/hrm1105/hrm1105.component').then((m) => m.Hrm1105Component),
  },
  {
    path: 'form/shift-roster',
    loadComponent: () =>
      import('./forms/hrm1104/hrm1104.component').then((m) => m.Hrm1104Component),
  },
  {
    path: 'form/device-sync-attendance',
    loadComponent: () =>
      import('./forms/hrm1102/hrm1102.component').then((m) => m.Hrm1102Component),
  },
  {
    path: 'form/leave-balance',
    loadComponent: () =>
      import('./forms/hrm1303/hrm1303.component').then((m) => m.Hrm1303Component),
  },
  {
    path: 'form/salary-sheet',
    loadComponent: () =>
      import('./forms/hrm1203/hrm1203.component').then((m) => m.Hrm1203Component),
  },
  {
    path: 'form/payslip-generator',
    loadComponent: () =>
      import('./forms/hrm1204/hrm1204.component').then((m) => m.Hrm1204Component),
  },

  // ── Attendance ────────────────────────────────────────────────────────────
  // HRM_1101 — component not yet built
  // {
  //   path: 'form/manual-attendance',
  //   loadComponent: () =>
  //     import('./forms/hrm1101/hrm1101.component').then((m) => m.Hrm1101Component),
  // },
  // HRM_1102 — component not yet built
  // {
  //   path: 'form/device-sync-attendance',
  //   loadComponent: () =>
  //     import('./forms/hrm1102/hrm1102.component').then((m) => m.Hrm1102Component),
  // },
  // HRM_1103 — component not yet built
  // {
  //   path: 'form/attendance-adjustment',
  //   loadComponent: () =>
  //     import('./forms/hrm1103/hrm1103.component').then((m) => m.Hrm1103Component),
  // },

  // ── Payroll ───────────────────────────────────────────────────────────────
  // HRM_1201 — component not yet built
  // {
  //   path: 'form/salary-structure-setup',
  //   loadComponent: () =>
  //     import('./forms/hrm1201/hrm1201.component').then((m) => m.Hrm1201Component),
  // },
  // HRM_1202 — component not yet built
  // {
  //   path: 'form/salary-processing',
  //   loadComponent: () =>
  //     import('./forms/hrm1202/hrm1202.component').then((m) => m.Hrm1202Component),
  // },
  // HRM_1203 — component not yet built
  // {
  //   path: 'report/salary-sheet',
  //   loadComponent: () =>
  //     import('./forms/hrm1203/hrm1203.component').then((m) => m.Hrm1203Component),
  // },
  // HRM_1204 — component not yet built
  // {
  //   path: 'report/payslip-generator',
  //   loadComponent: () =>
  //     import('./forms/hrm1204/hrm1204.component').then((m) => m.Hrm1204Component),
  // },
];

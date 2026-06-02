import { Routes } from '@angular/router';

/**
 * FIN module routes.
 * Pattern: {type}/{form-name-slug}  →  full URL: /fin/{type}/{slug}
 * All components pending — uncomment when built.
 */
export const FIN_ROUTES: Routes = [
  // ── Chart of Accounts ─────────────────────────────────────────────────────
  // FIN_1001 — component not yet built
  // {
  //   path: 'form/chart-of-accounts-setup',
  //   loadComponent: () =>
  //     import('./forms/fin1001/fin1001.component').then((m) => m.Fin1001Component),
  // },
  // FIN_1002 — component not yet built
  // {
  //   path: 'form/account-head-mapping',
  //   loadComponent: () =>
  //     import('./forms/fin1002/fin1002.component').then((m) => m.Fin1002Component),
  // },
  // FIN_1003 — component not yet built
  // {
  //   path: 'form/opening-balance-entry',
  //   loadComponent: () =>
  //     import('./forms/fin1003/fin1003.component').then((m) => m.Fin1003Component),
  // },

  // ── Voucher System ────────────────────────────────────────────────────────
  // FIN_1101 — component not yet built
  // {
  //   path: 'form/cash-voucher',
  //   loadComponent: () =>
  //     import('./forms/fin1101/fin1101.component').then((m) => m.Fin1101Component),
  // },
  // FIN_1102 — component not yet built
  // {
  //   path: 'form/bank-voucher',
  //   loadComponent: () =>
  //     import('./forms/fin1102/fin1102.component').then((m) => m.Fin1102Component),
  // },
  // FIN_1103 — component not yet built
  // {
  //   path: 'form/journal-voucher',
  //   loadComponent: () =>
  //     import('./forms/fin1103/fin1103.component').then((m) => m.Fin1103Component),
  // },
  // FIN_1104 — component not yet built
  // {
  //   path: 'form/contra-voucher',
  //   loadComponent: () =>
  //     import('./forms/fin1104/fin1104.component').then((m) => m.Fin1104Component),
  // },

  // ── Expense ───────────────────────────────────────────────────────────────
  // FIN_1201 — component not yet built
  // {
  //   path: 'form/expense-category',
  //   loadComponent: () =>
  //     import('./forms/fin1201/fin1201.component').then((m) => m.Fin1201Component),
  // },
  // FIN_1202 — component not yet built
  // {
  //   path: 'form/expense-entry',
  //   loadComponent: () =>
  //     import('./forms/fin1202/fin1202.component').then((m) => m.Fin1202Component),
  // },

  // ── Branch Finance ────────────────────────────────────────────────────────
  // FIN_1301 — component not yet built
  // {
  //   path: 'report/branch-wise-ledger',
  //   loadComponent: () =>
  //     import('./forms/fin1301/fin1301.component').then((m) => m.Fin1301Component),
  // },
  // FIN_1302 — component not yet built
  // {
  //   path: 'form/inter-branch-transfer',
  //   loadComponent: () =>
  //     import('./forms/fin1302/fin1302.component').then((m) => m.Fin1302Component),
  // },
  // FIN_1303 — component not yet built
  // {
  //   path: 'report/consolidated-report-setup',
  //   loadComponent: () =>
  //     import('./forms/fin1303/fin1303.component').then((m) => m.Fin1303Component),
  // },
];

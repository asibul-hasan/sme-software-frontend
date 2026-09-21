import { Routes } from '@angular/router';

/**
 * FIN module routes. Pattern: {type}/{slug} → full URL /fin/{type}/{slug}.
 */
export const FIN_ROUTES: Routes = [
  // ── Setup ──────────────────────────────────────────────────────────────────
  { path: 'form/chart-of-accounts', loadComponent: () => import('./forms/fin1001/fin1001.component').then((m) => m.Fin1001Component) },
  { path: 'form/account-group',     redirectTo: 'form/chart-of-accounts', pathMatch: 'full' },
  { path: 'form/voucher-type',      loadComponent: () => import('./forms/fin1003/fin1003.component').then((m) => m.Fin1003Component) },
  { path: 'form/opening-balance',   loadComponent: () => import('./forms/fin1004/fin1004.component').then((m) => m.Fin1004Component) },
  { path: 'form/bank-account',      loadComponent: () => import('./forms/fin1005/fin1005.component').then((m) => m.Fin1005Component) },
  { path: 'form/gl-mapping',        loadComponent: () => import('./forms/fin1006/fin1006.component').then((m) => m.Fin1006Component) },

  // ── Transactions ───────────────────────────────────────────────────────────
  { path: 'form/voucher-entry',     loadComponent: () => import('./forms/fin1101/fin1101.component').then((m) => m.Fin1101Component) },
  { path: 'form/bank-reconciliation', loadComponent: () => import('./forms/fin1102/fin1102.component').then((m) => m.Fin1102Component) },
  { path: 'form/posting-monitor',   loadComponent: () => import('./forms/fin1201/fin1201.component').then((m) => m.Fin1201Component) },
  { path: 'form/period-close',      loadComponent: () => import('./forms/fin1401/fin1401.component').then((m) => m.Fin1401Component) },

  // ── Sub-ledgers ────────────────────────────────────────────────────────────
  // FIN_1202 and FIN_1203 share one component — same reconciliation, opposite sign.
  // The routes stay separate so each keeps its own menu entry and permission.
  {
    path: 'form/accounts-payable',
    data: { formId: 'FIN_1202', partyType: 2 },
    loadComponent: () => import('./forms/subledger/subledger.component').then((m) => m.SubLedgerComponent),
  },
  {
    path: 'form/accounts-receivable',
    data: { formId: 'FIN_1203', partyType: 1 },
    loadComponent: () => import('./forms/subledger/subledger.component').then((m) => m.SubLedgerComponent),
  },

  // ── Reports ────────────────────────────────────────────────────────────────
  { path: 'report/trial-balance',   loadComponent: () => import('./forms/fin1301/fin1301.component').then((m) => m.Fin1301Component) },
  { path: 'report/account-ledger',  loadComponent: () => import('./forms/fin1302/fin1302.component').then((m) => m.Fin1302Component) },
  { path: 'report/day-book',        loadComponent: () => import('./forms/fin1303/fin1303.component').then((m) => m.Fin1303Component) },
  { path: 'report/profit-loss',     loadComponent: () => import('./forms/fin1304/fin1304.component').then((m) => m.Fin1304Component) },
  { path: 'report/balance-sheet',   loadComponent: () => import('./forms/fin1305/fin1305.component').then((m) => m.Fin1305Component) },
  { path: 'report/cash-flow',       loadComponent: () => import('./forms/fin1306/fin1306.component').then((m) => m.Fin1306Component) },
  { path: 'report/aging',           loadComponent: () => import('./forms/fin1307/fin1307.component').then((m) => m.Fin1307Component) },
];

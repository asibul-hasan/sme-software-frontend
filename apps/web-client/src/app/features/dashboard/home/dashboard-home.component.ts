import { ChangeDetectionStrategy, Component } from '@angular/core';

import { CommonModule } from '@angular/common';
import { StatCardsComponent } from './components/stat-cards/stat-cards.component';

import { SalesOverviewChartComponent } from './components/sales-overview/sales-overview-chart.component';
import { BranchSalesChartComponent } from './components/branch-sales/branch-sales-chart.component';

import { RecentTransactionsComponent } from './components/recent-transactions/recent-transactions.component';
import { QuickActionsComponent } from './components/quick-actions/quick-actions.component';

import { AlertsOverviewComponent } from './components/alerts-overview/alerts-overview.component';
import { SalesDistributionComponent } from './components/sales-distribution/sales-distribution.component';

import { BranchPerformanceComponent } from './components/branch-performance/branch-performance.component';
import { InventorySnapshotComponent } from './components/inventory-snapshot/inventory-snapshot.component';

import { PurchaseOrdersComponent } from './components/purchase-orders/purchase-orders.component';
import { FinancialOverviewComponent } from './components/financial-overview/financial-overview.component';

import { TopProductsComponent } from './components/top-products/top-products.component';
import { SalesVsPurchasesChartComponent } from './components/sales-vs-purchases/sales-vs-purchases-chart.component';

import { AppDatePickerComponent } from '@app/shared/components/date-picker';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    StatCardsComponent,
    SalesOverviewChartComponent,
    BranchSalesChartComponent,
    RecentTransactionsComponent,
    QuickActionsComponent,
    AlertsOverviewComponent,
    SalesDistributionComponent,
    BranchPerformanceComponent,
    InventorySnapshotComponent,
    PurchaseOrdersComponent,
    FinancialOverviewComponent,
    TopProductsComponent,
    SalesVsPurchasesChartComponent,
    AppDatePickerComponent,
  ],
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.scss'],
})
export class DashboardHomeComponent {}

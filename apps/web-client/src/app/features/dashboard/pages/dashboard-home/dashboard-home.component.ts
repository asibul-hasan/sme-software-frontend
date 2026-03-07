import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../../core';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule,
    TranslateModule,
  ],
  template: `
    <div class="dashboard-container">
      <!-- Page Header -->
      <div class="page-header">
        <h1>{{ 'DASHBOARD.TITLE' | translate }}</h1>
        <p class="subtitle">{{ 'DASHBOARD.WELCOME' | translate }}, {{ user()?.name }}!</p>
      </div>

      <!-- Stats Cards -->
      <mat-grid-list cols="4" rowHeight="120px" gutterSize="16" class="stats-grid">
        <mat-grid-tile>
          <mat-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon sales">
                <mat-icon>trending_up</mat-icon>
              </div>
              <div class="stat-info">
                <span class="stat-label">{{ 'DASHBOARD.TOTAL_SALES' | translate }}</span>
                <span class="stat-value">৳ 1,24,500</span>
                <span class="stat-change positive">+12.5%</span>
              </div>
            </div>
          </mat-card>
        </mat-grid-tile>

        <mat-grid-tile>
          <mat-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon products">
                <mat-icon>inventory_2</mat-icon>
              </div>
              <div class="stat-info">
                <span class="stat-label">{{ 'DASHBOARD.TOTAL_PRODUCTS' | translate }}</span>
                <span class="stat-value">456</span>
                <span class="stat-change">Total items</span>
              </div>
            </div>
          </mat-card>
        </mat-grid-tile>

        <mat-grid-tile>
          <mat-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon warning">
                <mat-icon>warning</mat-icon>
              </div>
              <div class="stat-info">
                <span class="stat-label">{{ 'DASHBOARD.LOW_STOCK' | translate }}</span>
                <span class="stat-value">23</span>
                <span class="stat-change negative">Needs attention</span>
              </div>
            </div>
          </mat-card>
        </mat-grid-tile>

        <mat-grid-tile>
          <mat-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon orders">
                <mat-icon>receipt_long</mat-icon>
              </div>
              <div class="stat-info">
                <span class="stat-label">{{ 'DASHBOARD.PENDING_ORDERS' | translate }}</span>
                <span class="stat-value">12</span>
                <span class="stat-change">To process</span>
              </div>
            </div>
          </mat-card>
        </mat-grid-tile>
      </mat-grid-list>

      <!-- Recent Activity -->
      <div class="recent-activity">
        <mat-card>
          <mat-card-header>
            <mat-card-title>{{ 'DASHBOARD.RECENT_ACTIVITY' | translate }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Activity list will be implemented here...</p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 2rem;

      h1 {
        margin: 0 0 0.5rem 0;
        font-size: 2rem;
        font-weight: 500;
      }

      .subtitle {
        margin: 0;
        color: var(--text-secondary);
      }
    }

    .stats-grid {
      margin-bottom: 2rem;

      @media (max-width: 1200px) {
        ::ng-deep .mat-grid-list {
          display: grid !important;
          grid-template-columns: repeat(2, 1fr) !important;
        }
      }

      @media (max-width: 600px) {
        ::ng-deep .mat-grid-list {
          display: grid !important;
          grid-template-columns: 1fr !important;
        }
      }
    }

    .stat-card {
      width: 100%;
      height: 100%;
      cursor: pointer;
      transition: transform 0.2s;

      &:hover {
        transform: translateY(-4px);
      }

      .stat-content {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;

          mat-icon {
            font-size: 32px;
            width: 32px;
            height: 32px;
            color: white;
          }

          &.sales {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          &.products {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }

          &.warning {
            background: linear-gradient(135deg, #ffa726 0%, #fb8c00 100%);
          }

          &.orders {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }
        }

        .stat-info {
          flex: 1;
          display: flex;
          flex-direction: column;

          .stat-label {
            font-size: 0.875rem;
            color: var(--text-secondary);
            margin-bottom: 0.25rem;
          }

          .stat-value {
            font-size: 1.75rem;
            font-weight: 600;
            margin-bottom: 0.25rem;
          }

          .stat-change {
            font-size: 0.75rem;
            color: var(--text-secondary);

            &.positive {
              color: #4caf50;
            }

            &.negative {
              color: #f44336;
            }
          }
        }
      }
    }

    .recent-activity {
      mat-card-content {
        min-height: 300px;
      }
    }
  `]
})
export class DashboardHomeComponent implements OnInit {
  public authService = inject(AuthService);
  user = this.authService.getUser();

  constructor() { }

  ngOnInit() {
    // Load dashboard data
  }
}
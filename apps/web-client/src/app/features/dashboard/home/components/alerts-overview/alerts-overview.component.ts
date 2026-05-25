
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-alerts-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alerts-overview.component.html',
  styleUrls: ['./alerts-overview.component.scss']
})
export class AlertsOverviewComponent {
  alerts = [
    { label: '5 Invoices are overdue', type: 'danger', icon: 'bi-file-earmark-excel-fill' },
    { label: '3 Purchase Orders pending', type: 'warning', icon: 'bi-clock-history' },
    { label: 'Low stock alert for 23 items', type: 'primary', icon: 'bi-exclamation-triangle-fill' },
    { label: 'System update available', type: 'info', icon: 'bi-arrow-repeat' },
  ];
}

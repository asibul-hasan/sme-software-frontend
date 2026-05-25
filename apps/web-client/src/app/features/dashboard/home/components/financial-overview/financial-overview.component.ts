
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-financial-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './financial-overview.component.html',
  styleUrls: ['./financial-overview.component.scss']
})
export class FinancialOverviewComponent {
  items = [
    { label: 'Cash & Bank Balance', value: '৳ 2,450,00', icon: 'bi-bank', color: 'success' },
    { label: 'Receivables (You will receive)', value: '৳ 1,245,300', icon: 'bi-person-fill', color: 'primary' },
    { label: 'Payables (You will pay)', value: '৳ 865,300', icon: 'bi-person-badge', color: 'warning' },
  ];
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recent-transactions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recent-transactions.component.html',
  styleUrls: ['./recent-transactions.component.scss']
})
export class RecentTransactionsComponent {
  activeTab: 'sales' | 'purchases' = 'sales';

  sales = [
    { date: '03 May 2024', id: 'SAL-001', entity: 'Rahim Traders', amount: '12,500', status: 'Completed' },
    { date: '03 May 2024', id: 'SAL-002', entity: 'Mim Stores', amount: '8,200', status: 'Pending' },
    { date: '02 May 2024', id: 'SAL-003', entity: 'General Customer', amount: '1,500', status: 'Completed' },
  ];

  purchases = [
    { date: '03 May 2024', id: 'PUR-001', entity: 'Fresh Food Ltd', amount: '45,000', status: 'Received' },
    { date: '02 May 2024', id: 'PUR-002', entity: 'Global Supplies', amount: '15,200', status: 'Ordered' },
  ];
}

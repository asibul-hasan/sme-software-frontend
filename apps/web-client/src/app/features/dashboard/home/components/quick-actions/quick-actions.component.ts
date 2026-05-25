
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-quick-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quick-actions.component.html',
  styleUrls: ['./quick-actions.component.scss']
})
export class QuickActionsComponent {
  actions = [
    { label: 'Create Invoice', icon: 'bi-file-earmark-plus-fill', color: 'success' },
    { label: 'Add Product', icon: 'bi-box-seam-fill', color: 'primary' },
    { label: 'Add Customer', icon: 'bi-person-fill-plus', color: 'purple' },
    { label: 'Record Expense', icon: 'bi-cash-stack', color: 'orange' },
    { label: 'Create Purchase', icon: 'bi-cart-fill', color: 'info' },
    { label: 'Add Supplier', icon: 'bi-truck', color: 'teal' },
  ];
}

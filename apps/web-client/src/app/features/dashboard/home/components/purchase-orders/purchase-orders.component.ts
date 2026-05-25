
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './purchase-orders.component.html',
  styleUrls: ['./purchase-orders.component.scss']
})
export class PurchaseOrdersComponent {
  orders = [
    { id: 'PO-240524-001', supplier: 'Fresh Food Ltd.', amount: '45,000', status: 'Received', statusColor: 'success' },
    { id: 'PO-240524-002', supplier: 'Amin Corporation', amount: '78,500', status: 'In Transit', statusColor: 'info' },
    { id: 'PO-240524-003', supplier: 'Shafiq Suppliers', amount: '25,600', status: 'Pending', statusColor: 'warning' },
    { id: 'PO-240524-004', supplier: 'Global Supplies', amount: '15,200', status: 'Pending', statusColor: 'warning' },
  ];
}

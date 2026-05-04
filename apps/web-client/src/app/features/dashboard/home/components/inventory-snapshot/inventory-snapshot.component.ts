import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-inventory-snapshot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventory-snapshot.component.html',
  styleUrls: ['./inventory-snapshot.component.scss']
})
export class InventorySnapshotComponent {
  items = [
    { label: 'Total Items', value: '1,254', icon: 'bi-grid-fill', color: 'secondary' },
    { label: 'Low Stock Items', value: '23', icon: 'bi-exclamation-triangle-fill', color: 'warning' },
    { label: 'Out of Stock Items', value: '7', icon: 'bi-x-circle-fill', color: 'danger' },
  ];
  stockValue = '৳ 5,245,300';
}

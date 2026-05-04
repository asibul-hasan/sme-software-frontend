import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-top-products',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './top-products.component.html',
  styleUrls: ['./top-products.component.scss']
})
export class TopProductsComponent {
  products = [
    { name: 'Product A', amount: '452,000', percentage: 85 },
    { name: 'Product B', amount: '385,500', percentage: 70 },
    { name: 'Product C', amount: '245,300', percentage: 55 },
    { name: 'Product D', amount: '189,450', percentage: 40 },
    { name: 'Product E', amount: '145,200', percentage: 30 },
  ];
}

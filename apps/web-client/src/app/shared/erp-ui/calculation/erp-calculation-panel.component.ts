import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'erp-calculation-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card border shadow-sm p-3 bg-light">
      <div class="d-flex justify-content-between align-items-center mb-1 text-muted small">
        <span>Subtotal</span>
        <span class="fw-semibold">{{ symbol() }}{{ subtotal() | number:'1.2-2' }}</span>
      </div>
      @if (discount() > 0) {
        <div class="d-flex justify-content-between align-items-center mb-1 text-danger small">
          <span>Discount</span>
          <span class="fw-semibold">- {{ symbol() }}{{ discount() | number:'1.2-2' }}</span>
        </div>
      }
      @if (taxAmount() > 0) {
        <div class="d-flex justify-content-between align-items-center mb-1 text-muted small">
          <span>Tax / VAT ({{ taxRate() }}%)</span>
          <span class="fw-semibold">+ {{ symbol() }}{{ taxAmount() | number:'1.2-2' }}</span>
        </div>
      }
      <hr class="my-2" />
      <div class="d-flex justify-content-between align-items-center fs-6 fw-bold text-dark">
        <span>Grand Total</span>
        <span class="text-primary">{{ symbol() }}{{ grandTotal() | number:'1.2-2' }}</span>
      </div>
    </div>
  `
})
export class ErpCalculationPanelComponent {
  symbol = input<string>('$');
  subtotal = input<number>(0);
  discount = input<number>(0);
  taxRate = input<number>(0);
  taxAmount = input<number>(0);
  grandTotal = input<number>(0);
}

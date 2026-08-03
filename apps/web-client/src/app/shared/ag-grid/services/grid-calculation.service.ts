import { Injectable } from '@angular/core';

export interface LineItemMath {
  qtyField?: string;
  unitPriceField?: string;
  discountField?: string;
  taxRateField?: string;
  lineAmountField?: string;
  netAmountField?: string;
  taxAmountField?: string;
  totalAmountField?: string;
}

@Injectable({ providedIn: 'root' })
export class GridCalculationService {
  /**
   * Recalculates standard ERP line item values:
   * LineAmount = Qty * UnitPrice
   * NetAmount = LineAmount - Discount
   * TaxAmount = NetAmount * (TaxRate / 100)
   * TotalAmount = NetAmount + TaxAmount
   */
  calculateLineItem<T = any>(row: T, config: LineItemMath): T {
    const updated = { ...row } as any;
    const qty = Number(updated[config.qtyField ?? 'qty'] ?? 0);
    const unitPrice = Number(updated[config.unitPriceField ?? 'unit_price'] ?? 0);
    const discount = Number(updated[config.discountField ?? 'discount_amount'] ?? 0);
    const taxRate = Number(updated[config.taxRateField ?? 'tax_rate'] ?? 0);

    const lineAmount = qty * unitPrice;
    const netAmount = Math.max(0, lineAmount - discount);
    const taxAmount = (netAmount * taxRate) / 100;
    const totalAmount = netAmount + taxAmount;

    if (config.lineAmountField) updated[config.lineAmountField] = Number(lineAmount.toFixed(2));
    if (config.netAmountField) updated[config.netAmountField] = Number(netAmount.toFixed(2));
    if (config.taxAmountField) updated[config.taxAmountField] = Number(taxAmount.toFixed(2));
    if (config.totalAmountField) updated[config.totalAmountField] = Number(totalAmount.toFixed(2));

    return updated;
  }

  /**
   * Calculates summary totals for pinned bottom row.
   */
  calculateColumnTotal<T = any>(rows: T[], field: keyof T | string): number {
    return rows.reduce((sum, row) => {
      const val = Number((row as any)[field] ?? 0);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }
}

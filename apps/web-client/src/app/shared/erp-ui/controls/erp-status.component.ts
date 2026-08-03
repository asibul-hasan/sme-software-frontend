import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ErpStatusType = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'POSTED' | 'CLOSED' | 'ACTIVE' | 'INACTIVE';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'erp-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClass">
      {{ statusText }}
    </span>
  `
})
export class ErpStatusComponent {
  status = input<ErpStatusType | string>('DRAFT');

  get statusText(): string {
    const s = String(this.status()).toUpperCase();
    return s;
  }

  get badgeClass(): string {
    const s = String(this.status()).toUpperCase();
    switch (s) {
      case 'APPROVED':
      case 'POSTED':
      case 'ACTIVE':
        return 'badge bg-success-subtle text-success border border-success-subtle px-2 py-1';
      case 'PENDING':
      case 'DRAFT':
        return 'badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1';
      case 'REJECTED':
      case 'CLOSED':
      case 'INACTIVE':
        return 'badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1';
      default:
        return 'badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1';
    }
  }
}

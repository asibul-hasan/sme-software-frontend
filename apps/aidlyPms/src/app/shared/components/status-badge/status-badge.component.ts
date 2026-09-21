import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, NzTagModule],
  template: `
    <nz-tag [nzColor]="resolvedColor" class="rounded-full px-2.5 py-0.5 text-xs font-medium border-0">
      {{ text }}
    </nz-tag>
  `,
})
export class StatusBadgeComponent {
  @Input({ required: true }) text = '';
  @Input() color?: string;
  @Input() type?: 'active' | 'inactive' | 'pending' | 'success' | 'danger' | 'warning';

  get resolvedColor(): string {
    if (this.color) return this.color;
    switch (this.type) {
      case 'active':
      case 'success':
        return 'success';
      case 'inactive':
      case 'danger':
        return 'error';
      case 'pending':
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  }
}

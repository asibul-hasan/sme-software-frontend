
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-branch-performance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './branch-performance.component.html',
  styleUrls: ['./branch-performance.component.scss']
})
export class BranchPerformanceComponent {
  branches = [
    { name: 'Head Office', revenue: '1.2M', percentage: 85, color: '#3b82f6' },
    { name: 'Uttara Branch', revenue: '0.8M', percentage: 60, color: '#10b981' },
    { name: 'Chattogram', revenue: '0.6M', percentage: 45, color: '#f43f5e' },
    { name: 'Sylhet Branch', revenue: '0.5M', percentage: 35, color: '#f59e0b' },
  ];
}

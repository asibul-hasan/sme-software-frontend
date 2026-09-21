import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, NzEmptyModule],
  template: `
    <div class="py-12 flex flex-col items-center justify-center bg-white rounded-lg border border-slate-200">
      <nz-empty
        [nzNotFoundImage]="image"
        [nzNotFoundContent]="description"
      >
        <ng-content select="[actions]"></ng-content>
      </nz-empty>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() description = 'No data available';
  @Input() image = 'simple';
}

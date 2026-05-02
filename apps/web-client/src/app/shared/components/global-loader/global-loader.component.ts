import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../../core/services/loader.service';

@Component({
  selector: 'app-global-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loader-overlay" *ngIf="loaderService.isLoading()">
      <div class="center-body">
        <div class="loader-spanne-20">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./global-loader.component.scss']
})
export class GlobalLoaderComponent {
  constructor(public loaderService: LoaderService) {}
}

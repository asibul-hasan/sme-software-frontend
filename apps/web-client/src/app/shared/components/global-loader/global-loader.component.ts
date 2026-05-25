import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LoaderService } from '../../../core/services/loader.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-global-loader',
  standalone: true,
  template: `
    @if (loaderService.isLoading()) {
      <div class="loader-overlay">
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
    }
  `,
  styleUrl: './global-loader.component.scss',
})
export class GlobalLoaderComponent {
  readonly loaderService = inject(LoaderService);
}

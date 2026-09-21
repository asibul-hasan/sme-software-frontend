import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzSpinModule,
    HeaderComponent,
    SidebarComponent,
  ],
  template: `
    <div class="flex h-screen overflow-hidden bg-slate-50">
      <!-- Sidebar -->
      <app-sidebar [collapsed]="collapsed"></app-sidebar>

      <!-- Main Layout Body -->
      <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
        <!-- Top Navigation Header -->
        <app-header
          [collapsed]="collapsed"
          (toggleCollapse)="collapsed = !collapsed"
        ></app-header>

        <!-- Main Page Content Area -->
        <main class="flex-1 overflow-y-auto p-4 md:p-6 relative">
          <!-- Global Loading Spinner Overlay -->
          @if (loadingService.isLoading()) {
            <div class="absolute inset-0 bg-white/60 z-50 flex items-center justify-center backdrop-blur-xs">
              <nz-spin nzSize="large" nzTip="Loading data..."></nz-spin>
            </div>
          }

          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
})
export class MainLayoutComponent {
  collapsed = false;
  readonly loadingService = inject(LoadingService);
}

import { Component, inject, HostListener, OnInit } from '@angular/core';
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
        <main class="flex-1 overflow-y-auto overflow-x-hidden min-w-0 max-w-full p-3 md:p-4 lg:p-6 relative">
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
export class MainLayoutComponent implements OnInit {
  collapsed = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
  readonly loadingService = inject(LoadingService);

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.collapsed = window.innerWidth < 1024;
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && !this.collapsed) {
      this.collapsed = true;
    }
  }
}

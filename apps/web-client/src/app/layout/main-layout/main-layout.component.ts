import { Component, ChangeDetectionStrategy, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { HeaderComponent } from '../components/header/header.component';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { FooterComponent } from '../components/footer/footer.component';
import { GlobalLoaderComponent } from '../../shared/components/global-loader/global-loader.component';
import { ErpCommandPaletteComponent } from '../../shared/erp-ui/command/erp-command-palette.component';
import { NotificationToastComponent } from '../../shared/components/notification-toast/notification-toast.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    GlobalLoaderComponent,
    ErpCommandPaletteComponent,
    NotificationToastComponent,
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent {
  isMobile = signal(false);
  isTablet = signal(false);
  sidebarCollapsed = signal(false);

  constructor(private breakpointObserver: BreakpointObserver) {
    this.observeBreakpoints();
  }

  // ── Global Keyboard Shortcuts ───────────────────────────
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.ctrlKey) {
      switch (event.key.toLowerCase()) {
        case 's':
          event.preventDefault();
          document.getElementById('mstSave')?.click();
          break;
        case 'n':
          event.preventDefault();
          document.getElementById('mstNew')?.click();
          break;
        case 'd':
          event.preventDefault();
          document.getElementById('mstDelete')?.click();
          break;
      }
    }
  }

  private observeBreakpoints() {
    this.breakpointObserver
      .observe([
        '(max-width: 991.98px)',
        Breakpoints.HandsetPortrait,
        Breakpoints.HandsetLandscape,
        Breakpoints.TabletPortrait,
      ])
      .subscribe((result) => {
        const isSmallScreen = this.breakpointObserver.isMatched('(max-width: 991.98px)');
        const isHandset = this.breakpointObserver.isMatched([
          Breakpoints.HandsetPortrait,
          Breakpoints.HandsetLandscape,
        ]);

        const isTablet = this.breakpointObserver.isMatched(
          Breakpoints.TabletPortrait,
        );

        this.isMobile.set(isHandset || isSmallScreen);
        this.isTablet.set(isTablet);

        if (isHandset || isTablet || isSmallScreen) {
          this.sidebarCollapsed.set(true); // Mobile sidebar is closed by default
        } else {
          const saved = localStorage.getItem('sme_sidebar_collapsed');
          this.sidebarCollapsed.set(saved !== null ? saved === 'true' : false);
        }
      });
  }

  toggleSidebar() {
    this.sidebarCollapsed.update((v) => {
      const newState = !v;
      localStorage.setItem('sme_sidebar_collapsed', String(newState));
      return newState;
    });
  }

  onThemeToggle(isDark: boolean) {
    document.documentElement.setAttribute(
      'data-theme',
      isDark ? 'dark' : 'light',
    );
  }
}

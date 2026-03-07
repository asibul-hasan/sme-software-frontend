
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { HeaderComponent } from '../components/header/header.component';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { FooterComponent } from '../components/footer/footer.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent {
  isMobile = signal(false);
  isTablet = signal(false);
  sidebarCollapsed = signal(false);

  constructor(private breakpointObserver: BreakpointObserver) {
    this.observeBreakpoints();
  }

  private observeBreakpoints() {
    this.breakpointObserver.observe([
      Breakpoints.HandsetPortrait,
      Breakpoints.HandsetLandscape,
      Breakpoints.TabletPortrait,
    ]).subscribe(result => {
      const isHandset = this.breakpointObserver.isMatched([
        Breakpoints.HandsetPortrait,
        Breakpoints.HandsetLandscape
      ]);

      const isTablet = this.breakpointObserver.isMatched(Breakpoints.TabletPortrait);

      this.isMobile.set(isHandset);
      this.isTablet.set(isTablet);

      if (isHandset || isTablet) {
        this.sidebarCollapsed.set(false); // Mobile sidebar is always full width when open
      } else {
        this.sidebarCollapsed.set(false);
      }
    });
  }

  toggleSidebar() {
      this.sidebarCollapsed.update(v => !v);
  }

  onThemeToggle(isDark: boolean) {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }
}

import { Component, ChangeDetectionStrategy, signal, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from '../components/header/header.component';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { FooterComponent } from '../components/footer/footer.component';
import { GlobalLoaderComponent } from '../../shared/components/global-loader/global-loader.component';
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
    GlobalLoaderComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent implements OnInit {
  isMobile = signal(false);
  isTablet = signal(false);
  sidebarCollapsed = signal(false);
  private router = inject(Router);

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

  ngOnInit() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.isMobile() || this.isTablet()) {
          this.sidebarCollapsed.set(true);
        }
      });
  }

  private observeBreakpoints() {
    this.breakpointObserver
      .observe([
        Breakpoints.HandsetPortrait,
        Breakpoints.HandsetLandscape,
        Breakpoints.TabletPortrait,
      ])
      .subscribe((result) => {
        const isHandset = this.breakpointObserver.isMatched([
          Breakpoints.HandsetPortrait,
          Breakpoints.HandsetLandscape,
        ]);

        const isTablet = this.breakpointObserver.isMatched(
          Breakpoints.TabletPortrait,
        );

        this.isMobile.set(isHandset);
        this.isTablet.set(isTablet);

        if (isHandset || isTablet) {
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

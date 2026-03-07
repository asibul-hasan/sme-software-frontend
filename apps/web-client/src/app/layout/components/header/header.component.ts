import {
  Component,
  signal,
  computed,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { AuthService, ThemeService, LanguageService } from '../../../core';
import { MenuService } from '../sidebar/services/menu-builder.service';

export interface BreadcrumbItem {
  label: string;
  url?: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    TranslateModule,
  ],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit {
  // ── Inputs ──────────────────────────────────────────────
  @Input() set sidebarCollapsed(val: boolean) {
    this._sidebarCollapsed.set(val);
  }

  // ── Outputs ─────────────────────────────────────────────
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() themeToggled = new EventEmitter<boolean>();

  // ── Signals ─────────────────────────────────────────────
  breadcrumbs = signal<BreadcrumbItem[]>([{ label: 'Dashboard', url: '/' }]);
  formCode = signal<string | null>(null);
  notificationCount = signal<number>(3);
  showAiPill = signal<boolean>(true);

  private router = inject(Router);
  public authService = inject(AuthService);
  public themeService = inject(ThemeService);
  public languageService = inject(LanguageService);
  public menuService = inject(MenuService);

  private _sidebarCollapsed = signal(false);

  // Computed Theme
  isDark = computed(() => this.themeService.isDarkMode());

  // User info
  user = this.authService.getUser();
  userName = computed(() => this.user()?.name || 'Admin User');
  userRole = computed(() => this.user()?.designation || 'System Admin');
  userInitials = computed(() => {
    const parts = this.userName().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  });

  ngOnInit() {
    // Build breadcrumbs from router events
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.buildBreadcrumbs());

    this.buildBreadcrumbs();
  }

  private buildBreadcrumbs() {
    let url = this.router.url;
    // Clean up query parameters or fragments
    url = url.split('?')[0].split('#')[0];

    // Attempt to match current URL against defined menu forms
    const matchingForm = this.menuService.menu.find((m) => {
      const formRoute = `/${this.menuService.toLowerCase(m.code)}/${m.type}/${this.menuService.toLowerCase(m.formId)}`;
      return url === formRoute || url.startsWith(formRoute + '/');
    });

    if (matchingForm) {
      // If we found a match, create breadcrumbs showing: Module > Submodule > Form Name
      this.breadcrumbs.set([
        {
          label:
            this.menuService.toCamelCaseRoute(matchingForm.module) ||
            matchingForm.module,
        },
        {
          label:
            this.menuService.toCamelCaseRoute(matchingForm.submodule) ||
            matchingForm.submodule,
        },
        {
          label:
            this.menuService.toCamelCaseRoute(matchingForm.formName) ||
            matchingForm.formName,
          url,
        },
      ]);
    } else {
      // Fallback: Use standard URL segmentation
      const segments = url.split('/').filter(Boolean);
      const crumbs: BreadcrumbItem[] = segments.map((seg, i) => ({
        label: this.toLabel(seg),
        url: '/' + segments.slice(0, i + 1).join('/'),
      }));

      this.breadcrumbs.set(
        crumbs.length ? crumbs : [{ label: 'Dashboard', url: '/' }],
      );
    }
  }

  private toLabel(seg: string): string {
    return seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // ── Event Handlers ──────────────────────────────────────
  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  onToggleTheme() {
    this.themeService.toggleTheme();
    this.themeToggled.emit(this.isDark());
  }

  onSearch() {
    /* open search dialog */
  }
  onNotifications() {
    /* open notifications panel */
  }

  onLanguage() {
    this.languageService.toggleLanguage();
  }

  onUserMenu() {
    // Open user dropdown -> usually handled by MatMenu but we can manually navigate for now
    this.router.navigate(['/profile']);
  }

  onAiClick() {
    /* open AI assistant */
  }
}

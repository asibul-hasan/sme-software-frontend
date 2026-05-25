import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService, ThemeService, LanguageService } from '../../../core';
import { MenuService } from '../sidebar/services/menu-builder.service';
import { MenuItem } from '../sidebar/models/menu.model';
import { SharedModule } from '../../../shared';

export interface BreadcrumbItem {
  label: string;
  url?: string;
}

export interface NotificationItem {
  id: string;
  icon: string;
  bgColor: string;
  color: string;
  title: string;
  text: string;
  time: string;
  subtext?: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-header',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
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
  private router = inject(Router);
  public authService = inject(AuthService);
  public themeService = inject(ThemeService);
  public languageService = inject(LanguageService);
  public menuService = inject(MenuService);

  breadcrumbs = signal<BreadcrumbItem[]>([{ label: 'Dashboard', url: '/' }]);
  formCode = signal<string | null>(null);
  showAiPill = signal<boolean>(true);

  notifications = signal<NotificationItem[]>([
    {
      id: '1',
      icon: 'redeem',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      color: '#10b981',
      title: "It's Cristina danny's",
      text: 'birthday today.',
      time: '3:00 AM',
      subtext: '2 min ago',
    },
    {
      id: '2',
      icon: 'chat',
      bgColor: 'rgba(14, 165, 233, 0.1)',
      color: '#0ea5e9',
      title: 'Aida Burg',
      text: 'commented your post.',
      time: '6:00 PM',
      subtext: '5 August',
    },
    {
      id: '3',
      icon: 'settings',
      bgColor: 'rgba(244, 63, 94, 0.1)',
      color: '#f43f5e',
      title: 'Your Profile is Complete',
      text: '60%',
      time: '2:45 PM',
      subtext: '7 hours ago',
    },
    {
      id: '4',
      icon: 'call',
      bgColor: 'rgba(99, 102, 241, 0.1)',
      color: '#6366f1',
      title: 'Cristina Danny',
      text: 'invited to join Meeting.',
      time: '9:10 PM',
      subtext: 'Daily scrum meeting time',
    },
  ]);
  notificationCount = computed(() => this.notifications().length);

  activeProfileTab = signal<'profile' | 'setting'>('profile');

  availableBranches = this.authService.availableBranches;
  
  selectedBranchId = computed(() => this.authService.user()?.branch_no || null);
  
  currentBranchName = computed(() => {
    const b = this.availableBranches().find((x) => x.branch_no === this.selectedBranchId());
    return b ? b.branch_name : 'Select Branch';
  });

  private _sidebarCollapsed = signal(false);
  isFullScreen = signal(false);

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
    let matchedModule: MenuItem | undefined;
    let matchedSub: MenuItem | undefined;
    let matchedForm: MenuItem | undefined;

    for (const mod of this.menuService.tree()) {
      for (const sub of mod.children || []) {
        for (const form of sub.children || []) {
          if (form.route && (url === form.route || url.startsWith(form.route + '/'))) {
            matchedModule = mod;
            matchedSub = sub;
            matchedForm = form;
            break;
          }
        }
        if (matchedForm) break;
      }
      if (matchedForm) break;
    }

    if (matchedForm && matchedModule && matchedSub) {
      // If we found a match, create breadcrumbs showing: Module > Submodule > Form Name
      this.breadcrumbs.set([
        { label: matchedModule.formName },
        { label: matchedSub.formName },
        { label: matchedForm.formName, url },
      ]);
    } else {
      // Fallback: Use standard URL segmentation
      const segments = url.split('/').filter(Boolean);
      const crumbs: BreadcrumbItem[] = segments.map((seg: string, i: number) => ({
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

  onToggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      this.isFullScreen.set(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        this.isFullScreen.set(false);
      }
    }
  }

  onSearch() {
    /* open search dialog */
  }

  onBranchChange(branchId: number) {
    this.authService.switchBranch(branchId);
    // Reload page to refresh all data for the new branch context
    window.location.reload();
  }

  onNotifications() {
    /* currently handled by matMenuTriggerFor in HTML */
  }

  onLanguage() {
    this.languageService.toggleLanguage();
  }

  onUserMenu() {
    /* currently handled by matMenuTriggerFor in HTML */
  }

  onLogout() {
    this.authService.logout();
  }

  onAiClick() {
    /* open AI assistant */
  }
}

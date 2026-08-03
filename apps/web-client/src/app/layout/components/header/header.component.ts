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
import { NotificationService, NotificationItem } from '../../../core/services/notification.service';
import { NotificationToastComponent } from '../../../shared/components/notification-toast/notification-toast.component';
import { NotificationModalComponent } from '../../../shared/components/notification-modal/notification-modal.component';
import { DialogService } from '../../../core/services/dialog.service';

export interface BreadcrumbItem {
  label: string;
  url?: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-header',
  standalone: true,
  imports: [SharedModule, NotificationToastComponent],
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
  public notificationService = inject(NotificationService);
  private dialogService = inject(DialogService);

  breadcrumbs = signal<BreadcrumbItem[]>([{ label: 'Dashboard', url: '/' }]);
  formCode = signal<string | null>(null);
  showAiPill = signal<boolean>(true);

  notifications = this.notificationService.notifications;
  notificationCount = this.notificationService.unreadCount;

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
    // Reload ONLY after the switch completes and the new branch token/session is
    // persisted — otherwise the reload aborts the request and rehydrates the old branch.
    this.authService.switchBranch(branchId).subscribe({
      next: () => window.location.reload(),
      error: () => {
        // switch failed — stay on the current branch (no reload)
      },
    });
  }

  /**
   * Opens the notification inbox through the shared DialogService — the project's dialog standard —
   * rather than toggling a hand-rolled overlay. Passing an item preselects it, so clicking a row in
   * the header dropdown lands on that notification's detail.
   */
  openNotifications(item?: NotificationItem): void {
    this.dialogService
      .open(NotificationModalComponent, {
        size: 'xl',
        panelClass: 'notification-dialog-panel',
        data: item ? { notificationNo: item.notification_no } : undefined,
      })
      // The dialog can mark things read or act on them, so refresh the bell when it closes.
      .subscribe(() => this.notificationService.fetchNotifications());
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

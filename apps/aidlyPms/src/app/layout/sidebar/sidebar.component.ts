import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  computed,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import {
  getSidebarTree,
  getBreadcrumb,
  getScreenByFormId,
  HOME_FORM_ID,
  SidebarModule,
  SidebarSubModule,
  SystemScreen,
} from '../../core/config/menu.config';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule, NzIconModule, NzTooltipModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  private readonly allSidebarModules: readonly SidebarModule[] = getSidebarTree();
  readonly homeScreen = getScreenByFormId(HOME_FORM_ID);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly sidebarModules = computed<readonly SidebarModule[]>(() => {
    const isMgr = this.authService.isManager();
    return this.allSidebarModules
      .filter((m) => {
        // Cashiers / salesmen cannot access Accounts (ACC), Settings (SYS), or Purchases (PUR)
        if (!isMgr && (m.module_code === 'ACC' || m.module_code === 'SYS' || m.module_code === 'PUR')) {
          return false;
        }
        return true;
      })
      .map((m) => ({
        ...m,
        sub_modules: m.sub_modules
          .map((sub) => ({
            ...sub,
            screens: sub.screens.filter((s) => this.authService.hasPermission(s.permission_code)),
          }))
          .filter((sub) => sub.screens.length > 0),
      }))
      .filter((m) => m.sub_modules.length > 0);
  });

  readonly searchTerm = signal('');
  readonly isFlyoutOpen = signal(false);
  readonly selectedModuleId = signal<string>('SAL');
  private readonly previewModuleId = signal<string | null>(null);
  private readonly collapsedSubmodules = signal<Record<string, boolean>>({});

  readonly activeBranchName = computed(() => this.authService.activeBranch()?.name || 'Kazi — Cumilla');

  readonly isHomeActive = computed(() => {
    const clean = this.router.url.split('?')[0];
    return clean === '/' || clean === '/dashboard';
  });

  readonly isPosActive = computed(() => {
    const clean = this.router.url.split('?')[0];
    return clean === '/customer/sale';
  });

  readonly selectedModule = computed<SidebarModule | null>(() => {
    const modules = this.sidebarModules();
    if (!modules.length) return null;

    const previewId = this.collapsed && this.isFlyoutOpen()
      ? this.previewModuleId()
      : null;
    const currentId = previewId ?? this.selectedModuleId();
    return modules.find(m => m.module_code === currentId) ?? modules[0];
  });

  readonly shouldShowPanel = computed(() => !this.collapsed || this.isFlyoutOpen());

  readonly isAllExpanded = computed(() => {
    const mod = this.selectedModule();
    if (!mod) return true;
    const collapsed = this.collapsedSubmodules();
    return !mod.sub_modules.some(sub => !!collapsed[sub.key]);
  });

  readonly filteredSubmodules = computed<SidebarSubModule[]>(() => {
    const mod = this.selectedModule();
    if (!mod) return [];

    const term = this.searchTerm().toLowerCase().trim();
    if (!term) {
      return [...mod.sub_modules];
    }

    return mod.sub_modules
      .map(sub => {
        const matchingScreens = sub.screens.filter(s =>
          s.title.toLowerCase().includes(term) ||
          s.form_id.toLowerCase().includes(term) ||
          (s.description && s.description.toLowerCase().includes(term))
        );
        return {
          ...sub,
          screens: matchingScreens,
        };
      })
      .filter(sub => sub.screens.length > 0);
  });

  constructor() {
    this.syncActiveModule(this.router.url);
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: unknown) => {
        const navEnd = event as NavigationEnd;
        this.syncActiveModule(navEnd.urlAfterRedirects || navEnd.url);
      });
  }

  @HostListener('document:keydown.escape')
  closeFlyoutOnEscape(): void {
    this.closeFlyout();
  }

  openFlyout(mod?: SidebarModule): void {
    if (!this.collapsed) return;
    if (mod) this.previewModuleId.set(mod.module_code);
    this.isFlyoutOpen.set(true);
  }

  closeFlyout(): void {
    if (!this.collapsed) return;
    this.isFlyoutOpen.set(false);
    this.previewModuleId.set(null);
  }

  onSidebarFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && (event.currentTarget as HTMLElement).contains(next)) return;
    this.closeFlyout();
  }

  onHomeClicked(): void {
    this.closeFlyout();
  }

  selectModule(mod: SidebarModule): void {
    this.selectedModuleId.set(mod.module_code);
    this.previewModuleId.set(mod.module_code);
    this.searchTerm.set('');
    if (this.collapsed) {
      this.openFlyout(mod);
    }
    const currentUrl = this.router.url.split('?')[0];
    const containsCurrent = mod.sub_modules.some(sub =>
      sub.screens.some(s => s.route.split('?')[0] === currentUrl)
    );
    if (!containsCurrent && mod.default_route) {
      this.router.navigateByUrl(mod.default_route);
    }
  }

  toggleSubmodule(key: string): void {
    this.collapsedSubmodules.update(state => ({
      ...state,
      [key]: !state[key],
    }));
  }

  toggleExpandAll(): void {
    const mod = this.selectedModule();
    if (!mod) return;
    const currentlyAllExpanded = this.isAllExpanded();
    const updated: Record<string, boolean> = { ...this.collapsedSubmodules() };
    for (const sub of mod.sub_modules) {
      updated[sub.key] = currentlyAllExpanded;
    }
    this.collapsedSubmodules.set(updated);
  }

  isSubmoduleCollapsed(key: string): boolean {
    if (this.searchTerm().trim()) return false;
    return !!this.collapsedSubmodules()[key];
  }

  onMenuItemSelected(): void {
    this.closeFlyout();
  }

  isRouteActive(route: string): boolean {
    const currentUrl = this.router.url.split('?')[0];
    const cleanRoute = route.split('?')[0];
    return currentUrl === cleanRoute;
  }

  hasActiveChild(mod: SidebarModule): boolean {
    const cleanUrl = this.router.url.split('?')[0];
    const breadcrumb = getBreadcrumb(cleanUrl);
    return breadcrumb?.module.module_code === mod.module_code;
  }

  isSubmoduleActive(sub: SidebarSubModule): boolean {
    const cleanUrl = this.router.url.split('?')[0];
    const breadcrumb = getBreadcrumb(cleanUrl);
    return breadcrumb?.sub.key === sub.key;
  }

  isModuleSelected(mod: SidebarModule): boolean {
    return this.selectedModule()?.module_code === mod.module_code;
  }

  getScreenIcon(screen: SystemScreen): string {
    const title = screen.title.toLowerCase();
    if (title.includes('add') || title.includes('create') || title.includes('form')) return 'form';
    if (title.includes('setting') || title.includes('config') || title.includes('rule')) return 'setting';
    if (title.includes('record') || title.includes('history') || title.includes('audit') || title.includes('register')) return 'history';
    if (title.includes('pos') || title.includes('sale') || title.includes('counter')) return 'shopping-cart';
    if (title.includes('purchase') || title.includes('supplier')) return 'shop';
    if (title.includes('cash') || title.includes('due') || title.includes('expense') || title.includes('income') || title.includes('balance') || title.includes('capital')) return 'dollar';
    if (title.includes('doctor') || title.includes('rx') || title.includes('prescription')) return 'user';
    if (title.includes('rep') || title.includes('staff')) return 'team';
    if (title.includes('role') || title.includes('permission') || title.includes('access')) return 'safety-certificate';
    if (title.includes('analytics') || title.includes('report') || title.includes('dashboard')) return 'fund';
    if (title.includes('expired') || title.includes('warning') || title.includes('alert')) return 'warning';
    if (title.includes('print') || title.includes('receipt') || title.includes('invoice')) return 'printer';
    if (title.includes('sms')) return 'message';
    return 'file-text';
  }

  private syncActiveModule(url: string): void {
    const clean = url.split('?')[0];
    const breadcrumb = getBreadcrumb(clean);
    if (breadcrumb) {
      this.selectedModuleId.set(breadcrumb.module.module_code);
    }
  }
}

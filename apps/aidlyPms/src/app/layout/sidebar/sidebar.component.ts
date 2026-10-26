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
import { AuthService } from '../../core/auth/auth.service';

export interface NavScreen {
  readonly form_id: string;
  readonly title: string;
  readonly title_bn?: string;
  readonly route: string;
  readonly icon: string;
  readonly description?: string;
  readonly badge?: string;
}

export interface NavSubModule {
  readonly key: string;
  readonly name: string;
  readonly name_bn: string;
  readonly icon: string;
  readonly screens: readonly NavScreen[];
}

export interface NavModule {
  readonly module: string;
  readonly module_bn: string;
  readonly module_code: string;
  readonly icon: string;
  readonly default_route: string;
  readonly sub_modules: readonly NavSubModule[];
}

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

  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly sidebarModules = computed<readonly NavModule[]>(() => {
    const rootMenu = this.authService.menu();
    const modules: NavModule[] = [];

    for (const m of rootMenu) {
      if (m.menu_type !== 'MODULE') continue;

      const subModules: NavSubModule[] = [];
      for (const sub of m.children || []) {
        const screens: NavScreen[] = [];
        for (const scr of sub.children || []) {
          const route = scr.route || scr.path;
          if (route && this.authService.hasMenuAccess(scr.menu_code, 'view')) {
            screens.push({
              form_id: scr.menu_code,
              title: scr.title,
              title_bn: scr.title_bn,
              route,
              icon: scr.icon || this.getScreenIcon(scr.title),
              description: scr.title,
            });
          }
        }
        if (screens.length > 0) {
          subModules.push({
            key: sub.menu_code,
            name: sub.title,
            name_bn: sub.title_bn,
            icon: sub.icon || 'folder',
            screens,
          });
        }
      }

      if (subModules.length > 0) {
        const modCode = m.menu_code.replace(/^MOD_/, '');
        modules.push({
          module: m.title,
          module_bn: m.title_bn,
          module_code: modCode,
          icon: m.icon || 'appstore',
          default_route: m.route || m.path || subModules[0]?.screens[0]?.route || '',
          sub_modules: subModules,
        });
      }
    }

    return modules;
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

  readonly selectedModule = computed<NavModule | null>(() => {
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

  readonly filteredSubmodules = computed<NavSubModule[]>(() => {
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
          (s.title_bn && s.title_bn.toLowerCase().includes(term)) ||
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

  openFlyout(mod?: NavModule): void {
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

  selectModule(mod: NavModule): void {
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

  hasActiveChild(mod: NavModule): boolean {
    const cleanUrl = this.router.url.split('?')[0];
    return mod.sub_modules.some(sub =>
      sub.screens.some(scr => scr.route.split('?')[0] === cleanUrl)
    );
  }

  isSubmoduleActive(sub: NavSubModule): boolean {
    const cleanUrl = this.router.url.split('?')[0];
    return sub.screens.some(scr => scr.route.split('?')[0] === cleanUrl);
  }

  isModuleSelected(mod: NavModule): boolean {
    return this.selectedModule()?.module_code === mod.module_code;
  }

  getScreenIcon(title: string): string {
    const t = (title || '').toLowerCase();
    if (t.includes('add') || t.includes('create') || t.includes('form')) return 'form';
    if (t.includes('setting') || t.includes('config') || t.includes('rule')) return 'setting';
    if (t.includes('record') || t.includes('history') || t.includes('audit') || t.includes('register')) return 'history';
    if (t.includes('pos') || t.includes('sale') || t.includes('counter')) return 'shopping-cart';
    if (t.includes('purchase') || t.includes('supplier')) return 'shop';
    if (t.includes('cash') || t.includes('due') || t.includes('expense') || t.includes('income') || t.includes('balance') || t.includes('capital')) return 'dollar';
    if (t.includes('doctor') || t.includes('rx') || t.includes('prescription')) return 'user';
    if (t.includes('rep') || t.includes('staff')) return 'team';
    if (t.includes('role') || t.includes('permission') || t.includes('access')) return 'safety-certificate';
    if (t.includes('analytics') || t.includes('report') || t.includes('dashboard')) return 'fund';
    if (t.includes('expired') || t.includes('warning') || t.includes('alert')) return 'warning';
    if (t.includes('print') || t.includes('receipt') || t.includes('invoice')) return 'printer';
    if (t.includes('sms')) return 'message';
    return 'file-text';
  }

  private syncActiveModule(url: string): void {
    const clean = url.split('?')[0];
    const mods = this.sidebarModules();
    for (const mod of mods) {
      for (const sub of mod.sub_modules) {
        if (sub.screens.some(s => s.route.split('?')[0] === clean)) {
          this.selectedModuleId.set(mod.module_code);
          return;
        }
      }
    }
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  effect,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from './models/menu.model';
import { MenuService } from './services/menu-builder.service';
import { SharedModule } from '../../../shared';
import { AuthContextService } from '../../../core/services/auth-context.service';
import { AppBootstrapService } from '../../../core/services/app-bootstrap.service';

const SIDEBAR_EXPANDED_KEY = 'sme_sidebar_expanded';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sidebar',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  private readonly router      = inject(Router);
  private readonly menuService = inject(MenuService);
  private readonly authCtx     = inject(AuthContextService);
  private readonly bootstrap   = inject(AppBootstrapService);

  /** Logged-in company — drives the sidebar brand pill. */
  readonly companyName    = computed(() => this.authCtx.user()?.company_name ?? 'Aidly');
  readonly companyInitial = computed(() => (this.authCtx.user()?.company_name ?? 'A').charAt(0).toUpperCase());

  /**
   * Base64 data-URL for the company logo.  Loaded once at login by
   * AppBootstrapService and cached in sessionStorage — no per-render API call.
   */
  readonly logoUrl = this.bootstrap.companyLogoDataUrl;

  @Input() set collapsed(val: boolean) {
    this.isCollapsed.set(val);
  }

  @Output() toggleCollapse = new EventEmitter<void>();

  readonly isCollapsed   = signal(false);
  readonly isFlyoutOpen  = signal(false);
  readonly searchTerm    = signal('');
  readonly isAllExpanded = signal(false);
  readonly selectedModuleId = signal<string | null>(null);
  private readonly previewModuleId = signal<string | null>(null);

  /**
   * Source-of-truth menu signal. Reactively rebuilt whenever the auth
   * context's flat menu changes (login, branch switch, logout). On every
   * rebuild we re-apply the persisted expanded-state set so the user's
   * open/closed groups survive page reloads.
   */
  readonly menuItems = computed<MenuItem[]>(() => {
    const tree = this.menuService.tree();
    this.applyExpandedState(tree, this.loadExpandedState());
    this.expandActivePath(tree);
    return tree;
  });

  readonly selectedModule = computed<MenuItem | null>(() => {
    const modules = this.menuItems();
    if (!modules.length) return null;

    const previewId = this.isCollapsed() && this.isFlyoutOpen()
      ? this.previewModuleId()
      : null;
    const selectedId = previewId ?? this.selectedModuleId();
    const selected = selectedId ? modules.find((item) => item.formId === selectedId) : null;
    if (selected) return selected;

    return modules.find((item) => this.containsActiveRoute(item)) ?? modules[0];
  });

  readonly shouldShowPanel = computed(() => !this.isCollapsed() || this.isFlyoutOpen());

  /**
   * Filtered tree for the search input — pruned breadth-first; parents whose
   * descendants match are auto-expanded so the result is reachable.
   */
  readonly filteredSubMenuItems = computed<MenuItem[]>(() => {
    const term  = this.searchTerm().toLowerCase().trim();
    const items = this.selectedModule()?.children ?? [];
    if (!term) return items;

    const filter = (nodes: MenuItem[]): MenuItem[] => {
      const out: MenuItem[] = [];
      for (const node of nodes) {
        const copy = { ...node };
        let matched = this.matchesSearch(copy, term);

        if (copy.children?.length) {
          const kids = filter(copy.children);
          if (kids.length) {
            copy.children = kids;
            copy.expanded = true;
            matched = true;
          } else {
            copy.children = [];
          }
        }

        if (matched) out.push(copy);
      }
      return out;
    };

    return filter(items);
  });

  readonly selectedModuleLabel = computed(() => this.selectedModule()?.formName ?? '');

  constructor() {
    // Persist expanded-state set whenever the menu changes shape.
    effect(() => {
      const items = this.menuItems();
      this.persistExpandedState(items);
    });
  }

  // ─── Public actions ────────────────────────────────────────────────────────
  @HostListener('document:keydown.escape')
  closeFlyoutOnEscape(): void {
    this.closeFlyout();
  }

  openFlyout(module?: MenuItem): void {
    if (!this.isCollapsed() || this.isSmallScreen()) return;
    if (module) this.previewModuleId.set(module.formId);
    this.isFlyoutOpen.set(true);
  }

  closeFlyout(): void {
    if (!this.isCollapsed()) return;
    this.isFlyoutOpen.set(false);
    this.previewModuleId.set(null);
  }

  onSidebarFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && (event.currentTarget as HTMLElement).contains(next)) return;
    this.closeFlyout();
  }

  toggleNode(node: MenuItem, event: Event): void {
    event.stopPropagation();
    node.expanded = !node.expanded;
    this.persistExpandedState(this.menuItems());
  }

  selectModule(module: MenuItem): void {
    this.selectedModuleId.set(module.formId);
    this.previewModuleId.set(module.formId);
    this.searchTerm.set('');
    this.openFlyout(module);
    const dashboard = module.children?.find((child) => !!child.route);
    if (dashboard?.route && !this.isActive(dashboard.route)) {
      this.router.navigateByUrl(dashboard.route);
    }
  }

  toggleSidebar(): void {
    this.closeFlyout();
    this.toggleCollapse.emit();
  }

  onMenuItemSelected(): void {
    if (this.isSmallScreen() && !this.isCollapsed()) {
      this.toggleCollapse.emit();
    }
  }

  toggleExpandAll(): void {
    const next = !this.isAllExpanded();
    this.isAllExpanded.set(next);

    const apply = (nodes: MenuItem[]): void => {
      for (const node of nodes) {
        node.expanded = next;
        if (node.children?.length) apply(node.children);
      }
    };
    const selected = this.selectedModule();
    if (selected?.children?.length) apply(selected.children);
    this.persistExpandedState(this.menuItems());

    if (!next) this.searchTerm.set('');
  }

  isActive(route?: string): boolean {
    if (!route) return false;
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  hasActiveChild(item: MenuItem): boolean {
    return this.containsActiveRoute(item);
  }

  isModuleSelected(module: MenuItem): boolean {
    return this.selectedModule()?.formId === module.formId;
  }

  moduleShortLabel(module: MenuItem): string {
    const raw = String(module.module ?? module.formId ?? module.formName ?? '').toUpperCase();
    const compact = raw.replace(/[^A-Z0-9]/g, '');

    if (compact.includes('HRM') || compact.includes('HR') || compact.includes('HUMAN')) return 'HUMAN';
    if (compact.includes('INV') || compact.includes('INVENTORY')) return 'INV';
    if (compact.includes('FIN') || compact.includes('ACCOUNT')) return 'FIN';
    if (compact.includes('PUR') || compact.includes('PROC')) return 'PUR';
    if (compact.includes('SAL') || compact.includes('SALE')) return 'SAL';
    if (compact.includes('RPT') || compact.includes('REPORT')) return 'RPT';
    if (compact.includes('SYS') || compact.includes('ADMIN')) return 'ADMIN';

    return (compact || module.formName || 'MOD').slice(0, 5);
  }

  // ─── Persistence helpers ───────────────────────────────────────────────────
  private loadExpandedState(): Set<string> {
    const raw = localStorage.getItem(SIDEBAR_EXPANDED_KEY);
    if (!raw) return new Set();
    try {
      return new Set<string>(JSON.parse(raw));
    } catch {
      return new Set();
    }
  }

  private applyExpandedState(nodes: MenuItem[], ids: Set<string>): void {
    for (const node of nodes) {
      if (node.formName && ids.has(node.formName)) node.expanded = true;
      if (node.children?.length) this.applyExpandedState(node.children, ids);
    }
  }

  private persistExpandedState(nodes: MenuItem[]): void {
    const ids = new Set<string>();
    const collect = (items: MenuItem[]): void => {
      for (const item of items) {
        if (item.expanded && item.formName) ids.add(item.formName);
        if (item.children?.length) collect(item.children);
      }
    };
    collect(nodes);
    localStorage.setItem(SIDEBAR_EXPANDED_KEY, JSON.stringify([...ids]));
  }

  private containsActiveRoute(item: MenuItem): boolean {
    if (this.isActive(item.route)) return true;
    return !!item.children?.some((child) => this.containsActiveRoute(child));
  }

  private expandActivePath(nodes: MenuItem[]): boolean {
    let anyActive = false;
    for (const node of nodes) {
      const active = this.isActive(node.route) || this.expandActivePath(node.children ?? []);
      if (active) {
        node.expanded = true;
        anyActive = true;
      }
    }
    return anyActive;
  }

  private matchesSearch(item: MenuItem, term: string): boolean {
    return [
      item.formName,
      item.formId,
      item.code,
      item.module,
      item.subModule,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term));
  }

  private isSmallScreen(): boolean {
    return typeof window !== 'undefined'
      && window.matchMedia('(max-width: 991.98px)').matches;
  }
}

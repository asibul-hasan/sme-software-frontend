import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  effect,
  inject,
  signal,    // still used for isCollapsed, searchTerm, isAllExpanded
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
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
  readonly searchTerm    = signal('');
  readonly isAllExpanded = signal(false);

  /**
   * Source-of-truth menu signal. Reactively rebuilt whenever the auth
   * context's flat menu changes (login, branch switch, logout). On every
   * rebuild we re-apply the persisted expanded-state set so the user's
   * open/closed groups survive page reloads.
   */
  readonly menuItems = computed<MenuItem[]>(() => {
    const tree = this.menuService.tree();
    this.applyExpandedState(tree, this.loadExpandedState());
    return tree;
  });

  /**
   * Filtered tree for the search input — pruned breadth-first; parents whose
   * descendants match are auto-expanded so the result is reachable.
   */
  readonly filteredMenuItems = computed<MenuItem[]>(() => {
    const term  = this.searchTerm().toLowerCase().trim();
    const items = this.menuItems();
    if (!term) return items;

    const filter = (nodes: MenuItem[]): MenuItem[] => {
      const out: MenuItem[] = [];
      for (const node of nodes) {
        const copy = { ...node };
        let matched = !!copy.formName?.toLowerCase().includes(term);

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

  constructor() {
    // Persist expanded-state set whenever the menu changes shape.
    effect(() => {
      const items = this.menuItems();
      this.persistExpandedState(items);
    });
  }

  // ─── Public actions ────────────────────────────────────────────────────────
  toggleNode(node: MenuItem, event: Event): void {
    event.stopPropagation();
    node.expanded = !node.expanded;
    this.persistExpandedState(this.menuItems());
  }

  toggleSidebar(): void {
    this.toggleCollapse.emit();
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
    apply(this.menuItems());
    this.persistExpandedState(this.menuItems());

    if (!next) this.searchTerm.set('');
  }

  isActive(route?: string): boolean {
    if (!route) return false;
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  hasActiveChild(item: MenuItem): boolean {
    return !!item.children?.some((child) => this.isActive(child.route));
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
}

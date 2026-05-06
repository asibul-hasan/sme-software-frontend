import {
  Component,
  signal,
  computed,
  Input,
  Output,
  EventEmitter,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from './models/menu.model';
import { PermissionService } from '../../../core/services/permission.service';
import { MenuService } from './services/menu-builder.service';
import { SharedModule } from '../../../shared';
import { globalConstants } from '../../../core/constants/global.constants';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  private permissionService = inject(PermissionService);
  private router = inject(Router);
  private service = inject(MenuService);

  menuItems = signal<MenuItem[]>([]);

  @Input() set collapsed(val: boolean) {
    this.isCollapsed.set(val);
  }

  @Output() toggleCollapse = new EventEmitter<void>();

  isCollapsed = signal(false);
  searchTerm = signal('');

  // Tracks if the global state is expanded or collapsed
  isAllExpanded = signal(false);

  // The filtered layout containing search matches and auto-expanding parents
  filteredMenuItems = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const items = this.menuItems();

    if (!term) {
      return items;
    }

    // Deep copy and filter function
    const filterNodes = (nodes: MenuItem[]): MenuItem[] => {
      const result: MenuItem[] = [];

      for (const node of nodes) {
        // Create a copy to avoid mutating the original signal object
        const n = { ...node };
        let matchFound = false;

        // Does this node itself match?
        if (n.formName && n.formName.toLowerCase().includes(term)) {
          matchFound = true;
        }

        // Recursively filter children
        if (n.children && n.children.length > 0) {
          const filteredChildren = filterNodes(n.children);
          if (filteredChildren.length > 0) {
            n.children = filteredChildren;
            n.expanded = true; // Auto-expand because a child matched
            matchFound = true;
          } else {
            n.children = [];
          }
        }

        // Keep this node if it matched or if any of its descendants matched
        if (matchFound) {
          result.push(n);
        }
      }

      return result;
    };

    return filterNodes(items);
  });

  constructor() {
    const builtMap = this.service.buildMenu(this.service.menu);
    // Restore expanded structures from localStorage
    const savedStr = localStorage.getItem('sme_sidebar_expanded');
    if (savedStr) {
      try {
        const expandedIds = new Set<string>(JSON.parse(savedStr));
        this.restoreExpandedState(builtMap, expandedIds);
      } catch (e) {
        console.error('Failed to parse sidebar state', e);
      }
    }
    this.menuItems.set(builtMap);
  }

  public toggleNode(node: MenuItem, event: Event) {
    event.stopPropagation();
    node.expanded = !node.expanded;
    this.saveExpandedState();
  }

  private saveExpandedState(nodes?: MenuItem[]) {
    if (!nodes) nodes = this.menuItems();
    const expandedIds = new Set<string>();
    const extract = (items: MenuItem[]) => {
      for (const item of items) {
        if (item.expanded && item.formName) expandedIds.add(item.formName);
        if (item.children) extract(item.children);
      }
    };
    extract(nodes);
    localStorage.setItem(
      'sme_sidebar_expanded',
      JSON.stringify(Array.from(expandedIds)),
    );
  }

  private restoreExpandedState(nodes: MenuItem[], expandedIds: Set<string>) {
    for (const node of nodes) {
      if (node.formName && expandedIds.has(node.formName)) {
        node.expanded = true;
      }
      if (node.children) this.restoreExpandedState(node.children, expandedIds);
    }
  }

  toggleSidebar() {
    this.toggleCollapse.emit();
  }

  toggleExpandAll() {
    const newState = !this.isAllExpanded();
    this.isAllExpanded.set(newState);

    const toggleNodes = (nodes: MenuItem[]) => {
      for (const node of nodes) {
        node.expanded = newState;
        if (node.children) {
          toggleNodes(node.children);
        }
      }
    };

    // Mutate the original items to open/close them
    const items = [...this.menuItems()];
    toggleNodes(items);
    this.menuItems.set(items);
    this.saveExpandedState(items);

    // If collapsing, also clear search
    if (!newState) {
      this.searchTerm.set('');
    }
  }

  private filterMenuItems() {
    // const filtered = MENU_ITEMS.filter(item => this.canShowMenuItem(item))
    //   .map(item => ({
    //     ...item,
    //     children: item.children?.filter(child => this.canShowMenuItem(child))
    //   }));
    // this.menuItems.set(filtered);
  }

  private canShowMenuItem(item: MenuItem): boolean {
    // If no module requirement, show it
    if (!item.module) return true;

    // Check if user has access to the module
    return this.permissionService.hasModule(item.module);
  }

  isActive(route?: string): boolean {
    if (!route) return false;
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  hasActiveChild(item: MenuItem): boolean {
    if (!item.children) return false;
    return item.children.some((child) => this.isActive(child.route));
  }
}

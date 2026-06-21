import {
  ChangeDetectionStrategy, Component, computed, effect, input, model, output, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  DEFAULT_TREE_CONFIG, FlatTreeNode, TreeBadge, TreeId, TreeRail, TreeViewConfig,
} from './tree-view.types';

/**
 * # `<app-tree-view>` — reusable hierarchical list
 *
 * A modern, theme-aware tree built for ERP master-detail sidebars. Accepts a
 * **flat** array of rows (each carrying an id + parent-id) and renders the
 * hierarchy with file-explorer guide lines, animated chevrons, folder/leaf
 * icons, child-count badges, an active accent bar, and expand/collapse-all.
 *
 * Presentational only — no HTTP/router. All scoping/data lives in the caller.
 *
 * ### Usage
 * ```html
 * <app-tree-view
 *   [data]="model.items()"
 *   [config]="treeConfig"
 *   [selectedId]="model.selectedNo()"
 *   [(searchTerm)]="search"
 *   (nodeClick)="model.select($any($event))"
 * />
 * ```
 * ```ts
 * treeConfig: TreeViewConfig = {
 *   idField: 'cost_center_no',
 *   parentField: 'parent_cost_center_no',
 *   labelField: 'cost_center_id',
 *   sublabelField: 'cost_center_name',
 *   badge: r => r['is_active'] === 1
 *     ? { label: 'Active', variant: 'success' }
 *     : { label: 'Inactive', variant: 'neutral' },
 * };
 * ```
 */
@Component({
  selector: 'app-tree-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  templateUrl: './tree-view.component.html',
  styles: `
    :host { display: block; }

    .tv-toolbar {
      display: flex; align-items: center; justify-content: space-between;
      gap: 8px; padding: 6px 8px; border-bottom: 1px solid var(--border-color);
      background: var(--bg-secondary);
    }
    .tv-count { font-size: 11px; font-weight: 600; color: var(--text-secondary); }
    .tv-tool-btn {
      display: inline-flex; align-items: center; gap: 4px;
      height: 26px; padding: 0 8px; border-radius: 6px;
      border: 1px solid var(--border-color); background: var(--card-bg);
      color: var(--text-secondary); font-size: 11px; font-weight: 600;
      cursor: pointer; transition: all .15s ease;
    }
    .tv-tool-btn:hover { color: var(--indigo); border-color: var(--indigo); background: rgba(var(--indigo-rgb), .06); }
    .tv-tool-btn mat-icon { font-size: 15px; width: 15px; height: 15px; }

    .tv-list { display: flex; flex-direction: column; padding: 4px; gap: 1px; }

    .tv-node {
      position: relative; display: flex; align-items: center;
      width: 100%; border: none; background: transparent; text-align: left;
      padding: 5px 8px; border-radius: 8px; cursor: pointer;
      color: var(--text-primary); transition: background .15s ease, color .15s ease;
    }
    .tv-node:hover { background: var(--sidebar-hover); }
    .tv-node:hover .tv-label { color: var(--indigo); }

    /* Active node — soft fill + left accent bar */
    .tv-node.is-active {
      background: var(--select-bg);
      box-shadow: inset 3px 0 0 0 var(--indigo);
    }
    .tv-node.is-active .tv-label { color: var(--indigo); font-weight: 700; }

    /* ── Indentation rails / connector guide lines ───────────────────────── */
    .tv-rails { display: flex; flex-shrink: 0; align-self: stretch; }
    .tv-rail  { position: relative; flex-shrink: 0; }
    /* continuing vertical line for an ancestor that still has siblings below */
    .tv-rail.has-line::before {
      content: ''; position: absolute; top: -4px; bottom: -4px; left: 50%;
      width: 1px; background: var(--border-color);
    }
    /* the node's own elbow connector */
    .tv-elbow { position: relative; flex-shrink: 0; }
    .tv-elbow::before {            /* vertical part of the elbow */
      content: ''; position: absolute; top: -4px; left: 50%; width: 1px;
      background: var(--border-color);
    }
    .tv-elbow.tee::before  { bottom: -4px; }          /* ├ continues down */
    .tv-elbow.last::before { height: calc(50% + 4px); }/* └ stops at center */
    .tv-elbow::after {             /* horizontal tick into the row */
      content: ''; position: absolute; top: 50%; left: 50%; right: 0;
      height: 1px; background: var(--border-color);
    }

    /* ── Chevron / leaf marker ───────────────────────────────────────────── */
    .tv-toggle {
      display: inline-flex; align-items: center; justify-content: center;
      width: 20px; height: 20px; flex-shrink: 0; border-radius: 5px;
      color: var(--text-secondary); transition: background .15s ease;
    }
    .tv-toggle:hover { background: rgba(var(--indigo-rgb), .12); color: var(--indigo); }
    .tv-toggle mat-icon {
      font-size: 18px; width: 18px; height: 18px;
      transition: transform .2s ease;
    }
    .tv-toggle.open mat-icon { transform: rotate(90deg); }
    .tv-leaf-dot {
      width: 6px; height: 6px; margin: 0 7px; border-radius: 50%;
      background: var(--border-color); flex-shrink: 0;
    }

    /* ── Icon + text ─────────────────────────────────────────────────────── */
    .tv-icon {
      display: inline-flex; align-items: center; justify-content: center;
      flex-shrink: 0; margin-right: 8px; color: var(--indigo);
    }
    .tv-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .tv-node.is-active .tv-icon { color: var(--indigo); }

    .tv-text { display: flex; flex-direction: column; min-width: 0; flex: 1; }
    .tv-label { font-size: 13px; font-weight: 600; line-height: 1.25;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tv-sub { font-size: 11.5px; color: var(--text-secondary); line-height: 1.25;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: .85; }

    /* ── Trailing badges ─────────────────────────────────────────────────── */
    .tv-trail { display: flex; align-items: center; gap: 6px; margin-left: 8px; flex-shrink: 0; }
    .tv-childcount {
      font-size: 10px; font-weight: 700; min-width: 18px; height: 18px; padding: 0 5px;
      display: inline-flex; align-items: center; justify-content: center;
      border-radius: 9px; background: var(--bg-secondary);
      color: var(--text-secondary); border: 1px solid var(--border-color);
    }
    .tv-pill {
      font-size: 10.5px; font-weight: 700; padding: 2px 8px; border-radius: 999px;
      white-space: nowrap; line-height: 1.2;
    }
    .tv-pill.primary { background: rgba(var(--indigo-rgb), .12);  color: var(--indigo); }
    .tv-pill.success { background: rgba(var(--success-rgb), .14); color: var(--success); }
    .tv-pill.warning { background: rgba(var(--warning-rgb), .14); color: var(--warning); }
    .tv-pill.danger  { background: rgba(var(--danger-rgb),  .14); color: var(--danger); }
    .tv-pill.info    { background: rgba(var(--info-rgb),    .14); color: var(--info); }
    .tv-pill.neutral { background: var(--bg-secondary); color: var(--text-secondary); border: 1px solid var(--border-color); }

    /* ── Empty state ─────────────────────────────────────────────────────── */
    .tv-empty { padding: 28px 16px; text-align: center; opacity: .75; }
    .tv-empty mat-icon { font-size: 34px; width: 34px; height: 34px; opacity: .5; margin-bottom: 6px; }
    .tv-empty p { margin: 0; font-size: 13px; color: var(--text-secondary); }
  `,
})
export class TreeViewComponent {
  // ── Inputs ────────────────────────────────────────────────────────────────
  readonly data       = input<Record<string, unknown>[]>([]);
  readonly config     = input<TreeViewConfig>({ idField: 'id', parentField: 'parent_id', labelField: 'name' });
  readonly selectedId = input<TreeId | null>(null);
  readonly searchTerm = model<string>('');

  // ── Outputs ───────────────────────────────────────────────────────────────
  readonly nodeClick = output<Record<string, unknown>>();

  // ── Internal state ──────────────────────────────────────────────────────────
  private readonly expanded = signal<Set<TreeId>>(new Set());
  private initialized = false;

  readonly merged = computed(() => ({ ...DEFAULT_TREE_CONFIG, ...this.config() }));

  constructor() {
    // Seed root expansion once, the first time data arrives.
    effect(() => {
      const rows = this.data();
      if (this.initialized || rows.length === 0) return;
      if (!this.merged().autoExpandRoots) { this.initialized = true; return; }
      const cfg = this.config();
      const roots = rows
        .filter(r => this.isRoot(r, cfg.parentField))
        .map(r => r[cfg.idField] as TreeId);
      this.expanded.set(new Set(roots));
      this.initialized = true;
    });
  }

  // ── Filtering (search shows matches + their ancestors) ──────────────────────
  private readonly filteredIds = computed<Set<TreeId> | null>(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return null;                       // null ⇒ no filter
    const cfg  = this.config();
    const rows = this.data();
    const byId = new Map<TreeId, Record<string, unknown>>(
      rows.map(r => [r[cfg.idField] as TreeId, r]),
    );
    const keep = new Set<TreeId>();
    for (const r of rows) {
      const lbl = typeof cfg.labelField === 'function' ? cfg.labelField(r) : String(r[cfg.labelField] ?? '');
      const sub = cfg.sublabelField
        ? (typeof cfg.sublabelField === 'function' ? cfg.sublabelField(r) : String(r[cfg.sublabelField] ?? ''))
        : '';
      const hay = `${lbl} ${sub}`.toLowerCase();
      if (!hay.includes(term)) continue;
      // include the match and walk up to every ancestor
      let cur: Record<string, unknown> | undefined = r;
      while (cur) {
        const id = cur[cfg.idField] as TreeId;
        if (keep.has(id)) break;
        keep.add(id);
        const pid = cur[cfg.parentField] as TreeId | null | undefined;
        cur = pid == null ? undefined : byId.get(pid);
      }
    }
    return keep;
  });

  /** Flattened, currently-visible nodes with connector metadata. */
  readonly nodes = computed<FlatTreeNode[]>(() => {
    const cfg      = this.config();
    const rows     = this.data();
    const keep     = this.filteredIds();
    const searching = keep !== null;
    const expanded = this.expanded();

    // group children by parent id
    const childMap = new Map<TreeId | null, Record<string, unknown>[]>();
    for (const r of rows) {
      if (keep && !keep.has(r[cfg.idField] as TreeId)) continue;
      const pid = this.isRoot(r, cfg.parentField) ? null : (r[cfg.parentField] as TreeId);
      const list = childMap.get(pid) ?? [];
      list.push(r);
      childMap.set(pid, list);
    }

    const out: FlatTreeNode[] = [];
    const walk = (parentId: TreeId | null, level: number, ancestorLines: boolean[]) => {
      const children = childMap.get(parentId) ?? [];
      children.forEach((row, i) => {
        const id   = row[cfg.idField] as TreeId;
        const kids = childMap.get(id) ?? [];
        const hasChildren = kids.length > 0;
        const isLast = i === children.length - 1;
        // when searching, force-expand so matches stay visible
        const isOpen = searching || expanded.has(id);

        // Pre-compute the connector glyph for each indentation column.
        //  • columns 0..level-2 → pass-through (│ if the ancestor branch continues)
        //  • column  level-1    → this node's own elbow (├ or └)
        const rails: TreeRail[] = [];
        for (let c = 0; c < level; c++) {
          if (c < level - 1) rails.push(ancestorLines[c + 1] ? 'line' : 'blank');
          else               rails.push(isLast ? 'last' : 'tee');
        }

        out.push({ row, id, level, hasChildren, expanded: isOpen, childCount: kids.length, isLast, rails });
        if (hasChildren && isOpen) {
          walk(id, level + 1, [...ancestorLines, !isLast]);
        }
      });
    };
    walk(null, 0, []);
    return out;
  });

  readonly totalVisible = computed(() => this.nodes().length);

  // ── Interactions ────────────────────────────────────────────────────────────
  toggle(id: TreeId, ev: Event): void {
    ev.stopPropagation();
    const set = new Set(this.expanded());
    set.has(id) ? set.delete(id) : set.add(id);
    this.expanded.set(set);
  }

  onClick(row: Record<string, unknown>): void {
    const cfg = this.config();
    const id = row[cfg.idField] as TreeId;
    if (this.parentIds().has(id)) {
      const set = new Set(this.expanded());
      set.has(id) ? set.delete(id) : set.add(id);
      this.expanded.set(set);
    }
    this.nodeClick.emit(row);
  }

  expandAll(): void {
    const cfg = this.config();
    this.expanded.set(new Set(this.data().map(r => r[cfg.idField] as TreeId)));
  }
  collapseAll(): void { this.expanded.set(new Set()); }

  /** Single-button toggle: expand everything, or collapse everything. */
  toggleAll(): void {
    this.allExpanded() ? this.collapseAll() : this.expandAll();
  }

  /** Ids of nodes that actually have children (referenced as a parent). */
  private readonly parentIds = computed<Set<TreeId>>(() => {
    const cfg = this.config();
    const parents = new Set<TreeId>();
    for (const r of this.data()) {
      const pid = r[cfg.parentField];
      if (pid != null && pid !== 0 && pid !== '') parents.add(pid as TreeId);
    }
    return parents;
  });

  /** True when every parent node is currently expanded → button offers "Collapse". */
  readonly allExpanded = computed<boolean>(() => {
    const parents = this.parentIds();
    if (parents.size === 0) return false;
    const exp = this.expanded();
    for (const id of parents) if (!exp.has(id)) return false;
    return true;
  });

  isSelected(id: TreeId): boolean {
    const sel = this.selectedId();
    return sel != null && String(sel) === String(id);
  }

  // ── Cell helpers ────────────────────────────────────────────────────────────
  label(row: Record<string, unknown>): string {
    const f = this.config().labelField;
    return typeof f === 'function' ? f(row) : String(row[f] ?? '');
  }
  sublabel(row: Record<string, unknown>): string {
    const f = this.config().sublabelField;
    if (!f) return '';
    return typeof f === 'function' ? f(row) : String(row[f] ?? '');
  }
  statusDot(row: Record<string, unknown>): boolean | null {
    return this.config().statusDot?.(row) ?? null;
  }
  badge(row: Record<string, unknown>): TreeBadge | null {
    return this.config().badge?.(row) ?? null;
  }
  icon(row: Record<string, unknown>, hasChildren: boolean, expanded: boolean): string {
    const fn = this.config().icon;
    if (fn) return fn({ row, hasChildren, expanded });
    return hasChildren ? (expanded ? 'folder_open' : 'folder') : 'description';
  }
  /** Map a connector glyph to its CSS classes. */
  railClass(rail: TreeRail): string {
    switch (rail) {
      case 'line': return 'tv-rail has-line';
      case 'tee':  return 'tv-elbow tee';
      case 'last': return 'tv-elbow last';
      default:     return 'tv-rail';            // 'blank'
    }
  }

  // ── private ──────────────────────────────────────────────────────────────────
  private isRoot(row: Record<string, unknown>, parentField: string): boolean {
    const pid = row[parentField];
    return pid == null || pid === 0 || pid === '';
  }
}

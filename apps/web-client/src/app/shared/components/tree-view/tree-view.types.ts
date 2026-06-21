/**
 * Reusable tree-view component types.
 *
 * The component accepts a FLAT list of rows (each with an id + parent-id field)
 * and builds the hierarchy internally — callers never pre-nest the data.
 */

export type TreeId = number | string;

export type TreeBadgeVariant =
  | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface TreeBadge {
  label: string;
  variant: TreeBadgeVariant;
}

/** Per-row escape hatch so callers can derive labels/badges/icons from any DTO shape. */
export interface TreeViewConfig {
  /** Field holding the row's unique id. e.g. 'cost_center_no'. */
  idField: string;
  /** Field holding the parent id (null/0/undefined ⇒ root). e.g. 'parent_cost_center_no'. */
  parentField: string;
  /** Primary bold label field or a function to derive it. e.g. 'cost_center_id'. */
  labelField: string | ((row: Record<string, unknown>) => string);
  /** Optional muted second line or a function to derive it. e.g. 'cost_center_name'. */
  sublabelField?: string | ((row: Record<string, unknown>) => string);

  /** Optional status dot on the left corner of the node (true=active, false=inactive). Return null to hide. */
  statusDot?: (row: Record<string, unknown>) => boolean | null;

  /** Optional status pill, derived per row. Return null to hide. */
  badge?: (row: Record<string, unknown>) => TreeBadge | null;

  /**
   * Leading icon for a node. Receives whether it has children and is expanded so
   * callers can show open/closed folders. Defaults to a folder/leaf set.
   */
  icon?: (ctx: { row: Record<string, unknown>; hasChildren: boolean; expanded: boolean }) => string;

  /** Pixels of indentation per depth level. Default 22. */
  indent?: number;
  /** Draw vertical hierarchy guide lines. Default true. */
  showConnectors?: boolean;
  /** Expand every root node on first load. Default true. */
  autoExpandRoots?: boolean;
  /** Show the slim toolbar (expand-all / collapse-all / count). Default true. */
  showToolbar?: boolean;

  /** Empty-state text + icon. */
  emptyText?: string;
  emptyIcon?: string;
}

/**
 * One indentation column's connector glyph:
 * - `blank` — empty spacer (ancestor's branch already ended)
 * - `line`  — continuing vertical guide │ (ancestor still has siblings below)
 * - `tee`   — the node's own ├ connector (has a sibling below it)
 * - `last`  — the node's own └ connector (last child of its parent)
 */
export type TreeRail = 'blank' | 'line' | 'tee' | 'last';

/** A single flattened, currently-visible tree row produced by the component. */
export interface FlatTreeNode {
  row: Record<string, unknown>;
  id: TreeId;
  level: number;
  hasChildren: boolean;
  expanded: boolean;
  childCount: number;
  /** Last child of its parent (drives the └ vs ├ elbow). */
  isLast: boolean;
  /** Pre-computed connector glyph per indentation column (length === level). */
  rails: TreeRail[];
}

export const DEFAULT_TREE_CONFIG: Required<
  Pick<TreeViewConfig, 'indent' | 'showConnectors' | 'autoExpandRoots' | 'showToolbar' | 'emptyText' | 'emptyIcon'>
> = {
  indent: 22,
  showConnectors: true,
  autoExpandRoots: true,
  showToolbar: true,
  emptyText: 'No records found',
  emptyIcon: 'account_tree',
};

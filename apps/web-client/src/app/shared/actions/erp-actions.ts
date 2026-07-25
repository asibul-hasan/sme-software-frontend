import type { ErpActionKind, ErpActionVariant } from '../grid/grid.types';

/**
 * The ERP action catalog — ONE definition per standard action.
 *
 * <p>Every Add / Edit / Delete / Approve / Post button in the application resolves
 * its icon, label, tooltip, variant and confirmation copy from here. Without a
 * catalog each form invents its own pairing ("Remove" with a trash icon in one
 * module, "Delete" with a cross in another) and the app stops reading as one
 * product. Follows the enterprise convention used by SAP Fiori / Dynamics 365:
 * destructive actions are visually distinct and always confirmed.</p>
 *
 * <p>Icons are Material Symbols names (the app already ships `material-icons`).</p>
 */
export interface ErpActionSpec {
  /** Material icon name. */
  icon: string;
  /** Default visible label. */
  label: string;
  /** Default tooltip — falls back to the label when omitted. */
  tooltip?: string;
  variant: ErpActionVariant;
  /** Destructive/irreversible: confirm before running unless explicitly disabled. */
  destructive?: boolean;
  /** Default confirmation copy for destructive (or opt-in confirmed) actions. */
  confirm?: { title: string; message: string; tone: 'primary' | 'warn' | 'danger' };
}

export const ERP_ACTIONS: Record<ErpActionKind, ErpActionSpec> = {
  add: { icon: 'add', label: 'Add', tooltip: 'Add new record', variant: 'primary' },
  edit: { icon: 'edit', label: 'Edit', tooltip: 'Edit record', variant: 'secondary' },
  view: { icon: 'visibility', label: 'View', tooltip: 'View details', variant: 'ghost' },

  delete: {
    icon: 'delete',
    label: 'Delete',
    tooltip: 'Delete record',
    variant: 'danger',
    destructive: true,
    confirm: {
      title: 'Delete Record',
      message: 'Are you sure you want to delete this record? This action cannot be undone.',
      tone: 'danger',
    },
  },

  save: { icon: 'check', label: 'Save', tooltip: 'Save changes', variant: 'success' },
  update: { icon: 'sync', label: 'Update', tooltip: 'Update record', variant: 'success' },

  cancel: {
    icon: 'undo',
    label: 'Cancel',
    tooltip: 'Cancel',
    variant: 'secondary',
    destructive: true,
    confirm: {
      title: 'Cancel',
      message: 'Cancel this record? Unsaved changes will be lost.',
      tone: 'warn',
    },
  },

  submit: {
    icon: 'send',
    label: 'Submit',
    tooltip: 'Submit for approval',
    variant: 'primary',
    confirm: {
      title: 'Submit',
      message: 'Submit this record for approval?',
      tone: 'primary',
    },
  },

  approve: {
    icon: 'check_circle',
    label: 'Approve',
    tooltip: 'Approve',
    variant: 'success',
    confirm: {
      title: 'Approve',
      message: 'Approve this record?',
      tone: 'primary',
    },
  },

  reject: {
    icon: 'cancel',
    label: 'Reject',
    tooltip: 'Reject',
    variant: 'danger',
    destructive: true,
    confirm: {
      title: 'Reject',
      message: 'Reject this record? A reason is normally required.',
      tone: 'danger',
    },
  },

  post: {
    icon: 'post_add',
    label: 'Post',
    tooltip: 'Post to ledger',
    variant: 'success',
    confirm: {
      title: 'Post',
      message: 'Post this document? Posted documents cannot be edited.',
      tone: 'warn',
    },
  },

  print: { icon: 'print', label: 'Print', tooltip: 'Print', variant: 'secondary' },
  export: { icon: 'file_download', label: 'Export', tooltip: 'Export data', variant: 'secondary' },
  import: { icon: 'file_upload', label: 'Import', tooltip: 'Import data', variant: 'secondary' },
  download: { icon: 'download', label: 'Download', tooltip: 'Download', variant: 'secondary' },

  refresh: { icon: 'refresh', label: 'Refresh', tooltip: 'Reload data', variant: 'ghost' },
  search: { icon: 'search', label: 'Search', tooltip: 'Search', variant: 'ghost' },
  filter: { icon: 'filter_list', label: 'Filter', tooltip: 'Filter', variant: 'ghost' },
  reset: { icon: 'restart_alt', label: 'Reset', tooltip: 'Reset the form', variant: 'warning' },

  duplicate: { icon: 'content_copy', label: 'Duplicate', tooltip: 'Duplicate record', variant: 'secondary' },
  close: { icon: 'close', label: 'Close', tooltip: 'Close', variant: 'ghost' },
};

/** Resolve a catalog entry; `'custom'` (or an unknown kind) yields a neutral spec. */
export function erpAction(kind: ErpActionKind | 'custom'): ErpActionSpec {
  return (
    ERP_ACTIONS[kind as ErpActionKind] ?? {
      icon: 'bolt',
      label: 'Action',
      variant: 'secondary' as ErpActionVariant,
    }
  );
}

/**
 * Confirmation copy for an action, honouring an explicit override.
 * Returns `null` when the action should run immediately.
 *
 * <p>Defaults (no `override`): any action carrying `confirm` copy in the catalog
 * asks first — that is every destructive action (delete, reject, cancel) plus the
 * consequential ones (submit, approve, post). Everything else runs immediately.
 * Pass `false` to suppress, an object to customise, `true` to force a confirm on
 * an action that has no catalog copy.</p>
 */
export function resolveConfirm(
  kind: ErpActionKind | 'custom',
  override?: boolean | { title?: string; message?: string; tone?: 'primary' | 'warn' | 'danger' },
): { title: string; message: string; tone: 'primary' | 'warn' | 'danger' } | null {
  if (override === false) return null;

  const spec = erpAction(kind);
  const base = spec.confirm ?? {
    title: spec.label,
    message: `${spec.label} this record?`,
    tone: spec.destructive ? ('danger' as const) : ('primary' as const),
  };

  if (typeof override === 'object') {
    return {
      title: override.title ?? base.title,
      message: override.message ?? base.message,
      tone: override.tone ?? base.tone,
    };
  }

  // override === true  → always confirm.
  // override undefined → confirm only when the catalog says this action warrants it.
  if (override === true || spec.confirm) return { ...base };
  return null;
}

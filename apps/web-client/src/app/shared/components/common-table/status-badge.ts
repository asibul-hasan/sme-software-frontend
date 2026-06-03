import { BadgeConfig } from './table.types';

/**
 * Standard status → pill mapper so every form renders identical status badges.
 *
 * Handles active flags (`1`/`0`, `true`/`false`) and the common document/order
 * statuses (pending, posted, confirmed, fulfilled, paid, …). Unknown values fall
 * back to a neutral pill showing the raw text.
 *
 * Usage in a column def:
 * ```ts
 * { title: 'Status', field: 'status', cellType: 'badge', badgeConfig: statusBadge }
 * { title: 'Active', field: 'is_active', cellType: 'badge', badgeConfig: statusBadge }
 * ```
 */
export function statusBadge(value: unknown): BadgeConfig | null {
  if (value == null || value === '') return null;

  // Boolean / 1-0 active flags.
  if (value === 1 || value === true || value === '1') return { label: 'Active', variant: 'success' };
  if (value === 0 || value === false || value === '0') return { label: 'Inactive', variant: 'neutral' };

  const key = String(value).trim().toLowerCase();
  const map: Record<string, BadgeConfig> = {
    active:            { label: 'Active',            variant: 'success' },
    inactive:          { label: 'Inactive',          variant: 'neutral' },
    current:           { label: 'Current',           variant: 'success' },
    pending:           { label: 'Pending',           variant: 'warning' },
    submitted:         { label: 'Submitted',         variant: 'info'    },
    approved:          { label: 'Approved',          variant: 'success' },
    rejected:          { label: 'Rejected',          variant: 'danger'  },
    posted:            { label: 'Posted',            variant: 'success' },
    confirmed:         { label: 'Confirmed',         variant: 'info'    },
    fulfilled:         { label: 'Fulfilled',         variant: 'success' },
    'partially shipped':{ label: 'Partially Shipped', variant: 'warning' },
    shipped:           { label: 'Shipped',           variant: 'info'    },
    delivered:         { label: 'Delivered',         variant: 'success' },
    cancelled:         { label: 'Cancelled',         variant: 'danger'  },
    canceled:          { label: 'Canceled',          variant: 'danger'  },
    void:              { label: 'Void',              variant: 'danger'  },
    draft:             { label: 'Draft',             variant: 'neutral' },
    open:              { label: 'Open',              variant: 'info'    },
    closed:            { label: 'Closed',            variant: 'neutral' },
    paid:              { label: 'Paid',              variant: 'success' },
    unpaid:            { label: 'Unpaid',            variant: 'warning' },
    overdue:           { label: 'Overdue',           variant: 'danger'  },
    locked:            { label: 'Locked',            variant: 'danger'  },
  };

  return map[key] ?? { label: String(value), variant: 'neutral' };
}

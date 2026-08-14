import { Injectable, signal } from '@angular/core';
import { PriceLineRequest } from './data.service';

export interface HeldCart {
  id: string;
  label: string;
  customer_no: number | null;
  lines: PriceLineRequest[];
  /** Used to prune carts nobody came back for — localStorage has no expiry of its own. */
  created_at: string;
  /** Snapshot for the drawer chip only; the real total is re-quoted on resume. */
  approx_total: number;
}

/**
 * Parked carts, kept in localStorage rather than the database.
 *
 * A held cart is a convenience, not a document: nothing is reserved, no invoice
 * row exists, and the stock is still sellable to whoever tenders first. That is
 * the deliberate trade for a single-till shop — it keeps the whole feature on the
 * client. When a customer runs several tills against one warehouse this needs to
 * move server-side with real reservations.
 */
@Injectable()
export class PosHoldStore {
  /** Beyond this the drawer stops being a tray and starts being a graveyard. */
  private static readonly MaxCarts = 20;

  /** Carts older than this are dropped on load. */
  private static readonly MaxAgeHours = 24;

  private storageKey = 'aidly.pos.holds';

  readonly carts = signal<HeldCart[]>([]);

  /**
   * Scopes storage to the till. Two cashiers on one machine, or one machine
   * switched between branches, must never see each other's parked carts.
   */
  configure(companyNo: number | null, branchNo: number | null, terminalNo: number | null): void {
    this.storageKey = `aidly.pos.holds.${companyNo ?? 0}.${branchNo ?? 0}.${terminalNo ?? 0}`;
    this.load();
  }

  hold(label: string, customerNo: number | null, lines: PriceLineRequest[], approxTotal: number): void {
    if (!lines.length) return;

    const cart: HeldCart = {
      id: crypto.randomUUID(),
      label,
      customer_no: customerNo,
      lines: structuredClone(lines),
      created_at: new Date().toISOString(),
      approx_total: approxTotal,
    };

    // Newest first, and the oldest falls off the end once the cap is hit.
    const next = [cart, ...this.carts()].slice(0, PosHoldStore.MaxCarts);
    this.write(next);
  }

  resume(id: string): HeldCart | null {
    const cart = this.carts().find((c) => c.id === id) ?? null;
    if (cart) this.discard(id);
    return cart;
  }

  discard(id: string): void {
    this.write(this.carts().filter((c) => c.id !== id));
  }

  clear(): void {
    this.write([]);
  }

  // ── persistence ───────────────────────────────────────────────────────────

  private load(): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      const parsed: HeldCart[] = raw ? JSON.parse(raw) : [];
      const cutoff = Date.now() - PosHoldStore.MaxAgeHours * 3600_000;

      const fresh = parsed.filter((c) => {
        const at = Date.parse(c.created_at);
        return Number.isFinite(at) && at >= cutoff && Array.isArray(c.lines) && c.lines.length > 0;
      });

      this.carts.set(fresh);
      if (fresh.length !== parsed.length) this.persist(fresh);
    } catch {
      // Corrupt or unavailable storage must not stop the till from selling.
      this.carts.set([]);
    }
  }

  private write(carts: HeldCart[]): void {
    this.carts.set(carts);
    this.persist(carts);
  }

  private persist(carts: HeldCart[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(carts));
    } catch {
      // Quota or private-browsing failures are not worth interrupting a sale over.
    }
  }
}

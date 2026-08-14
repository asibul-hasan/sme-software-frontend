import { Injectable, computed, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject, debounceTime, finalize, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isSuccess } from '../../../../../core/models/response.model';
import { AuthContextService } from '../../../../../core/services/auth-context.service';
import {
  PosDataService, PosOption, PosSession, PosTerminal, PriceLineRequest, QuoteResult, Tender,
} from './data.service';
import { PosHoldStore } from './hold-store.service';

export interface CartLine extends PriceLineRequest {
  product_name: string;
  uom_name?: string | null;
}

export const PAYMENT_METHODS = [
  { value: 1, label: 'Cash' },
  { value: 2, label: 'Card' },
  { value: 3, label: 'bKash / Nagad' },
  { value: 4, label: 'Bank Transfer' },
  { value: 6, label: 'Credit (Due)' },
] as const;

/**
 * Till state. A signal store rather than a reactive form: the cart is rebuilt on
 * every scan, and a FormGroup per line is measurably too slow for scan-heavy use.
 *
 * The one rule this class obeys: it never computes money. Totals come from
 * `quote-price` and are displayed as received, so what the cashier reads is
 * always what the server will charge.
 */
@Injectable()
export class PosModelService {
  private data = inject(PosDataService);
  private toastr = inject(ToastrService);
  private auth = inject(AuthContextService);
  readonly holds = inject(PosHoldStore);

  // ── context ───────────────────────────────────────────────────────────────
  terminals = signal<PosTerminal[]>([]);
  terminalNo = signal<number | null>(null);
  session = signal<PosSession | null>(null);
  customers = signal<PosOption[]>([]);
  customerNo = signal<number | null>(null);

  // ── cart ──────────────────────────────────────────────────────────────────
  cart = signal<CartLine[]>([]);
  quote = signal<QuoteResult | null>(null);
  billDiscountValue = signal(0);
  isPricing = signal(false);
  isConfirming = signal(false);

  // ── tender ────────────────────────────────────────────────────────────────
  tenders = signal<Tender[]>([]);
  showTender = signal(false);
  showHolds = signal(false);

  /**
   * Minted once per sale and reused on every retry, so a double-click or a
   * network hiccup can never ring the same sale up twice.
   */
  private clientUuid = crypto.randomUUID();

  private repriceRequests = new Subject<void>();

  readonly hasSession = computed(() => this.session() !== null);
  readonly lineCount = computed(() => this.cart().length);
  readonly grandTotal = computed(() => this.quote()?.grand_total ?? 0);
  readonly tenderedTotal = computed(() => this.tenders().reduce((sum, t) => sum + (t.amount || 0), 0));
  readonly balanceDue = computed(() => round2(this.grandTotal() - this.tenderedTotal()));
  readonly canConfirm = computed(() =>
    this.hasSession() && this.lineCount() > 0 && this.balanceDue() <= 0 && !this.isConfirming());

  /** Cash handed over above what the cash tenders apply — never negative. */
  readonly changeDue = computed(() => {
    const cash = this.tenders().filter((t) => t.payment_method === 1);
    const handed = cash.reduce((s, t) => s + (t.tendered_amount ?? t.amount ?? 0), 0);
    const applied = cash.reduce((s, t) => s + (t.amount ?? 0), 0);
    return round2(Math.max(0, handed - applied));
  });

  constructor() {
    // Debounced so a burst of scans costs one pricing round trip, not one each.
    this.repriceRequests
      .pipe(
        debounceTime(180),
        switchMap(() => {
          this.isPricing.set(true);
          return this.data
            .quotePrice({
              customer_no: this.customerNo(),
              bill_discount_type: 1,
              bill_discount_value: this.billDiscountValue(),
              shipping_charge: 0,
              allow_below_min_price: false,
              lines: this.toRequestLines(),
            })
            .pipe(finalize(() => this.isPricing.set(false)));
        }),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) this.quote.set(res.data);
        },
        error: (err) => this.toastr.error(apiMessage(err, 'Could not price the cart')),
      });
  }

  // ── startup ───────────────────────────────────────────────────────────────

  init(): void {
    this.data.getTerminals().subscribe((res) => {
      if (!isSuccess(res) || !res.data?.length) {
        this.toastr.warning('No POS terminal is set up for this branch (SAL_1005)');
        return;
      }
      this.terminals.set(res.data);
      this.selectTerminal(res.data[0].terminal_no);
    });

    this.data.getCustomers().subscribe((res) => {
      if (isSuccess(res) && res.data) {
        this.customers.set(res.data);
        // Walk-in is the overwhelmingly common case, so default to the first customer.
        if (res.data.length) this.customerNo.set(res.data[0].no);
      }
    });
  }

  selectTerminal(terminalNo: number): void {
    this.terminalNo.set(terminalNo);
    const user = this.auth.user();
    this.holds.configure(user?.company_no ?? null, user?.branch_no ?? null, terminalNo);
    this.refreshSession();
  }

  refreshSession(): void {
    const terminal = this.terminalNo();
    if (!terminal) return;

    this.data.currentSession(terminal).subscribe({
      next: (res) => this.session.set(isSuccess(res) ? (res.data ?? null) : null),
      error: () => this.session.set(null),
    });
  }

  /** Decision D3: the till prompts, it never opens a drawer on the cashier's behalf. */
  openSession(openingFloat: number): void {
    const terminal = this.terminalNo();
    if (!terminal) return;

    this.data.openSession(terminal, openingFloat).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.session.set(res.data);
          this.toastr.success(`Session ${res.data.session_id} opened`);
        }
      },
      error: (err) => this.toastr.error(apiMessage(err, 'Could not open the session')),
    });
  }

  // ── cart ──────────────────────────────────────────────────────────────────

  scan(barcode: string): void {
    const code = barcode.trim();
    if (!code) return;

    this.data.resolveBarcode(code).subscribe({
      next: (res) => {
        if (!isSuccess(res) || !res.data) {
          this.toastr.warning(`Unknown barcode: ${code}`);
          return;
        }
        const hit = res.data;
        this.addLine({
          product_no: hit.product_no,
          variant_no: hit.variant_no ?? null,
          uom_no: hit.uom_no ?? null,
          // A carton barcode adds its whole pack, not one unit.
          qty: hit.pack_qty > 0 ? hit.pack_qty : 1,
          product_name: hit.product_name ?? hit.product_id ?? `#${hit.product_no}`,
        });
      },
      error: () => this.toastr.warning(`Unknown barcode: ${code}`),
    });
  }

  addLine(line: CartLine): void {
    // Scanning the same thing twice bumps the quantity instead of stacking rows.
    const existing = this.cart().findIndex(
      (l) => l.product_no === line.product_no && (l.variant_no ?? null) === (line.variant_no ?? null)
             && (l.uom_no ?? null) === (line.uom_no ?? null));

    if (existing >= 0) {
      const next = [...this.cart()];
      next[existing] = { ...next[existing], qty: next[existing].qty + line.qty };
      this.cart.set(next);
    } else {
      this.cart.set([...this.cart(), line]);
    }

    this.reprice();
  }

  setQty(index: number, qty: number): void {
    if (qty <= 0) { this.removeLine(index); return; }
    const next = [...this.cart()];
    next[index] = { ...next[index], qty };
    this.cart.set(next);
    this.reprice();
  }

  setLineDiscount(index: number, value: number): void {
    const next = [...this.cart()];
    next[index] = { ...next[index], line_discount_type: 1, line_discount_value: Math.max(0, value) };
    this.cart.set(next);
    this.reprice();
  }

  removeLine(index: number): void {
    this.cart.set(this.cart().filter((_, i) => i !== index));
    this.reprice();
  }

  setBillDiscount(value: number): void {
    this.billDiscountValue.set(Math.max(0, value));
    this.reprice();
  }

  clearCart(): void {
    this.cart.set([]);
    this.quote.set(null);
    this.tenders.set([]);
    this.billDiscountValue.set(0);
    this.showTender.set(false);
    // A fresh sale needs a fresh idempotency key.
    this.clientUuid = crypto.randomUUID();
  }

  private reprice(): void {
    if (!this.cart().length) { this.quote.set(null); return; }
    this.repriceRequests.next();
  }

  private toRequestLines(): PriceLineRequest[] {
    return this.cart().map((l) => ({
      product_no: l.product_no,
      variant_no: l.variant_no ?? null,
      uom_no: l.uom_no ?? null,
      qty: l.qty,
      line_discount_type: l.line_discount_type ?? 1,
      line_discount_value: l.line_discount_value ?? 0,
    }));
  }

  // ── hold drawer ───────────────────────────────────────────────────────────

  holdCart(): void {
    if (!this.cart().length) return;

    const label = this.customerLabel() || `Cart ${this.holds.carts().length + 1}`;
    this.holds.hold(label, this.customerNo(), this.toRequestLines(), this.grandTotal());
    this.clearCart();
    this.toastr.success('Cart held');
  }

  resumeCart(id: string): void {
    const cart = this.holds.resume(id);
    if (!cart) return;

    this.clearCart();
    this.customerNo.set(cart.customer_no);
    this.cart.set(cart.lines.map((l) => ({ ...l, product_name: `#${l.product_no}` })));
    this.showHolds.set(false);

    // Re-quote rather than trusting the parked total: prices may have moved
    // since the cart was set aside.
    this.reprice();
    this.toastr.info('Cart resumed and re-priced');
  }

  // ── tender ────────────────────────────────────────────────────────────────

  addTender(method: number, amount: number, tendered?: number): void {
    if (amount <= 0) return;
    this.tenders.set([...this.tenders(), {
      payment_method: method,
      amount: round2(amount),
      tendered_amount: tendered != null ? round2(tendered) : null,
    }]);
  }

  removeTender(index: number): void {
    this.tenders.set(this.tenders().filter((_, i) => i !== index));
  }

  confirm(onDone: (invoiceId: string) => void): void {
    const terminal = this.terminalNo();
    const customer = this.customerNo();
    if (!terminal || !customer || !this.canConfirm()) return;

    this.isConfirming.set(true);
    this.data
      .confirmSale({
        client_uuid: this.clientUuid,
        terminal_no: terminal,
        customer_no: customer,
        bill_discount_type: 1,
        bill_discount_value: this.billDiscountValue(),
        shipping_charge: 0,
        allow_below_min_price: false,
        lines: this.toRequestLines(),
        tenders: this.tenders(),
      })
      .pipe(finalize(() => this.isConfirming.set(false)))
      .subscribe({
        next: (res) => {
          if (!isSuccess(res) || !res.data) return;
          const invoiceId = res.data.invoice_id;
          this.clearCart();
          this.toastr.success(`Sale ${invoiceId} completed`);
          onDone(invoiceId);
        },
        error: (err) => this.toastr.error(apiMessage(err, 'Could not complete the sale')),
      });
  }

  customerLabel(): string {
    const no = this.customerNo();
    return this.customers().find((c) => c.no === no)?.name ?? '';
  }
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Surfaces the server's own message — it explains min-price and session refusals. */
function apiMessage(err: unknown, fallback: string): string {
  const message = (err as { error?: { message?: string } })?.error?.message;
  return message?.trim() ? message : fallback;
}

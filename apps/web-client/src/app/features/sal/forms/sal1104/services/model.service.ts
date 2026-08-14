import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { IPromoTarget, IPromotion, SalOption, Sal1104DataService } from './data.service';

/** Types the pricing engine actually fires. The rest save but stay inert. */
export const SUPPORTED_TYPES = [1, 2, 3, 4, 5];

export const PROMO_TYPES = [
  { value: 1, label: 'Line discount %' },
  { value: 2, label: 'Line discount amount' },
  { value: 3, label: 'Bill discount %' },
  { value: 4, label: 'Bill discount amount' },
  { value: 5, label: 'Buy X get Y free' },
  { value: 6, label: 'Quantity break (not applied yet)' },
  { value: 7, label: 'Coupon (not applied yet)' },
  { value: 8, label: 'Bundle (not applied yet)' },
] as const;

export const SCOPE_TYPES = [
  { value: 1, label: 'Selected products' },
  { value: 2, label: 'Selected categories' },
  { value: 3, label: 'Selected brands' },
  { value: 4, label: 'Everything' },
  { value: 5, label: 'Customer / group' },
] as const;

export const WEEKDAYS = [
  { bit: 0, label: 'Mon' }, { bit: 1, label: 'Tue' }, { bit: 2, label: 'Wed' },
  { bit: 3, label: 'Thu' }, { bit: 4, label: 'Fri' }, { bit: 5, label: 'Sat' },
  { bit: 6, label: 'Sun' },
] as const;

/**
 * SAL_1104 Promotions.
 *
 * The form's job is to stop someone building a rule that means two things at once —
 * which fields matter depends entirely on the promo type, so it shows only those.
 */
@Injectable()
export class Sal1104ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Sal1104DataService);
  private toastr = inject(ToastrService);

  items = signal<IPromotion[]>([]);
  products = signal<SalOption[]>([]);
  categories = signal<SalOption[]>([]);
  brands = signal<SalOption[]>([]);
  targets = signal<IPromoTarget[]>([]);
  selectedNo = signal<number | null>(null);
  searchTerm = signal('');
  isLoading = signal(false);
  isSaving = signal(false);

  promoType = signal(1);
  scopeType = signal(1);
  weekdayMask = signal(0);

  form!: FormGroup;

  readonly filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const rows = this.items();
    if (!term) return rows;
    return rows.filter(
      (p) => (p.promotion_id || '').toLowerCase().includes(term)
          || (p.promotion_name || '').toLowerCase().includes(term));
  });

  /** Warns before someone builds a rule that will never fire. */
  readonly isSupportedType = computed(() => SUPPORTED_TYPES.includes(this.promoType()));

  readonly isPercent = computed(() => this.promoType() === 1 || this.promoType() === 3);
  readonly isAmount = computed(() => this.promoType() === 2 || this.promoType() === 4);
  readonly isBuyXGetY = computed(() => this.promoType() === 5);
  readonly isLineLevel = computed(() => this.promoType() === 1 || this.promoType() === 2);

  /** Products/categories/brands are only meaningful for the matching scope. */
  readonly needsTargets = computed(() => [1, 2, 3].includes(this.scopeType()));
  readonly targetKind = computed<'product' | 'category' | 'brand' | null>(() => {
    switch (this.scopeType()) {
      case 1: return 'product';
      case 2: return 'category';
      case 3: return 'brand';
      default: return null;
    }
  });

  readonly targetOptions = computed(() => {
    switch (this.targetKind()) {
      case 'product': return this.products();
      case 'category': return this.categories();
      case 'brand': return this.brands();
      default: return [];
    }
  });

  initForm(): void {
    const today = new Date().toISOString().substring(0, 10);
    this.form = this.fb.group({
      promotion_no: [null],
      promotion_id: ['', [Validators.required, Validators.maxLength(30)]],
      promotion_name: ['', [Validators.required, Validators.maxLength(150)]],
      promo_type: [1, [Validators.required]],
      scope_type: [1, [Validators.required]],
      priority: [0],
      is_stackable: [0],
      min_qty: [null],
      min_amount: [null],
      discount_pct: [null],
      discount_amount: [null],
      buy_qty: [null],
      get_qty: [null],
      max_discount_amount: [null],
      customer_type: [null],
      price_tier: [null],
      start_date: [today, [Validators.required]],
      end_date: [today, [Validators.required]],
      start_time: [''],
      end_time: [''],
      usage_limit: [null],
      remarks: [''],
      is_active: [1],
    });

    this.form.get('promo_type')!.valueChanges.subscribe((v) => this.promoType.set(Number(v)));
    this.form.get('scope_type')!.valueChanges.subscribe((v) => {
      this.scopeType.set(Number(v));
      // Targets picked for one scope mean nothing under another.
      this.targets.set([]);
    });
  }

  loadLookups(): void {
    this.data.lookups().subscribe((res) => {
      if (!isSuccess(res) || !res.data) return;
      this.products.set(res.data.products ?? []);
      this.categories.set(res.data.categories ?? []);
      this.brands.set(res.data.brands ?? []);
    });
  }

  loadList(reselect: number | null = null): void {
    this.isLoading.set(true);
    this.data
      .list()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (!isSuccess(res) || !res.data) return;
        this.items.set(res.data);

        const target = reselect ?? this.selectedNo();
        if (target) this.select(target);
      });
  }

  select(promotionNo: number): void {
    this.data.detail(promotionNo).subscribe((res) => {
      if (!isSuccess(res) || !res.data) return;
      const p = res.data;

      this.selectedNo.set(p.promotion_no ?? null);
      this.promoType.set(p.promo_type);
      this.scopeType.set(p.scope_type);
      this.weekdayMask.set(p.weekday_mask ?? 0);
      this.targets.set(p.targets ?? []);

      this.form.patchValue({
        ...p,
        start_date: (p.start_date ?? '').substring(0, 10),
        end_date: (p.end_date ?? '').substring(0, 10),
        start_time: p.start_time ?? '',
        end_time: p.end_time ?? '',
      });
    });
  }

  newPromotion(): void {
    this.selectedNo.set(null);
    this.targets.set([]);
    this.weekdayMask.set(0);
    this.promoType.set(1);
    this.scopeType.set(1);
    this.initForm();
  }

  // ── targets ───────────────────────────────────────────────────────────────

  addTarget(no: number, role = 1): void {
    if (!no) return;
    const kind = this.targetKind();
    if (!kind) return;

    const already = this.targets().some(
      (t) => t.target_role === role
          && (kind === 'product' ? t.product_no === no
            : kind === 'category' ? t.category_no === no
            : t.brand_no === no));
    if (already) return;

    const name = this.targetOptions().find((o) => o.no === no)?.name ?? `#${no}`;
    this.targets.set([...this.targets(), {
      target_role: role,
      product_no: kind === 'product' ? no : null,
      category_no: kind === 'category' ? no : null,
      brand_no: kind === 'brand' ? no : null,
      product_name: name,
    }]);
  }

  removeTarget(index: number): void {
    this.targets.set(this.targets().filter((_, i) => i !== index));
  }

  toggleWeekday(bit: number): void {
    this.weekdayMask.set(this.weekdayMask() ^ (1 << bit));
  }

  isWeekdayOn(bit: number): boolean {
    return (this.weekdayMask() & (1 << bit)) !== 0;
  }

  // ── persistence ───────────────────────────────────────────────────────────

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Fill in the required fields');
      return;
    }

    if (this.needsTargets() && !this.targets().some((t) => t.target_role === 1)) {
      this.toastr.warning('Select at least one item this promotion applies to');
      return;
    }

    const payload: IPromotion = {
      ...(this.form.getRawValue() as IPromotion),
      // 0 and null both mean "every day"; send null so intent is unambiguous.
      weekday_mask: this.weekdayMask() || null,
      targets: this.targets(),
    };

    const no = payload.promotion_no ?? null;
    this.isSaving.set(true);

    const request$ = no ? this.data.update(no, payload) : this.data.save(payload);
    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (!isSuccess(res) || !res.data) return;
        this.toastr.success(no ? 'Promotion updated' : 'Promotion created');
        this.loadList(res.data.promotion_no ?? null);
      },
      error: (err) => this.toastr.error(apiMessage(err, 'Could not save the promotion')),
    });
  }

  remove(): void {
    const no = this.selectedNo();
    if (!no) return;

    this.data.remove(no).subscribe({
      next: () => {
        this.toastr.success('Promotion deleted');
        this.newPromotion();
        this.loadList();
      },
      // Refused once a sale has used it — the server explains why.
      error: (err) => this.toastr.error(apiMessage(err, 'Could not delete the promotion')),
    });
  }
}

function apiMessage(err: unknown, fallback: string): string {
  const message = (err as { error?: { message?: string } })?.error?.message;
  return message?.trim() ? message : fallback;
}

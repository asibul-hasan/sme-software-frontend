import { Signal, computed, signal } from '@angular/core';

/**
 * Read-only view of paginator state used by the `<app-sidebar-pagination>` component.
 */
export interface PaginatorState<T> {
  readonly pageSize: Signal<number>;
  readonly currentPage: Signal<number>;
  readonly totalPages: Signal<number>;
  readonly totalItems: Signal<number>;
  readonly paged: Signal<T[]>;
  readonly pageSizeOptions: readonly number[];

  firstPage(): void;
  prevPage(): void;
  nextPage(): void;
  lastPage(): void;
  goToPage(page: number): void;
  setPageSize(size: number): void;
  /** Snap back to page 1 — call when any filter input changes. */
  reset(): void;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

/**
 * Build a signal-based paginator over an existing filtered list.
 *
 * Usage in a model service:
 *
 *     filteredBranches = computed(() => ...);
 *     branchPager = makePaginator(this.filteredBranches);
 *
 *     // template
 *     @for (b of model.branchPager.paged(); track ...) { ... }
 *     <app-sidebar-pagination [pager]="model.branchPager" />
 *
 * Call `pager.reset()` whenever filters change so the user doesn't end up
 * stranded on an empty page.
 */
export function makePaginator<T>(
  source: Signal<T[]>,
  options: { pageSize?: number; pageSizeOptions?: readonly number[] } = {},
): PaginatorState<T> {
  const pageSize    = signal(options.pageSize ?? 10);
  const currentPage = signal(1);

  const totalItems = computed(() => source().length);
  const totalPages = computed(() =>
    Math.max(1, Math.ceil(totalItems() / pageSize())),
  );

  const paged = computed(() => {
    const list = source();
    const size = pageSize();
    // Clamp so that shrinking filters can't strand us on an empty page.
    const page = Math.min(currentPage(), totalPages());
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  const goToPage = (page: number): void => {
    const clamped = Math.max(1, Math.min(page, totalPages()));
    currentPage.set(clamped);
  };

  return {
    pageSize,
    currentPage,
    totalPages,
    totalItems,
    paged,
    pageSizeOptions: options.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS,

    firstPage: () => goToPage(1),
    prevPage:  () => goToPage(currentPage() - 1),
    nextPage:  () => goToPage(currentPage() + 1),
    lastPage:  () => goToPage(totalPages()),
    goToPage,
    setPageSize: (size: number) => {
      pageSize.set(size);
      currentPage.set(1);
    },
    reset: () => currentPage.set(1),
  };
}

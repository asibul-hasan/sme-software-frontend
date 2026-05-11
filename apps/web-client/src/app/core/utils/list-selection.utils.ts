/**
 * After a list reload, resolves which item should be selected.
 *
 * - If `selectedKey` matches an item's key → select that item (same record stays selected).
 * - Otherwise (record deleted or key is null) → fall back to `fallbackIndex` (default 0).
 *
 * Returns `{ item, index }` or `null` when the list is empty.
 */
export function resolvePostReloadSelection<T>(
  items: T[],
  getKey: (item: T) => unknown,
  selectedKey: unknown,
  fallbackIndex = 0,
): { item: T; index: number } | null {
  if (!items.length) return null;

  if (selectedKey != null) {
    const idx = items.findIndex((item) => getKey(item) === selectedKey);
    if (idx !== -1) return { item: items[idx], index: idx };
  }

  const safeIndex = Math.min(fallbackIndex, items.length - 1);
  return { item: items[safeIndex], index: safeIndex };
}

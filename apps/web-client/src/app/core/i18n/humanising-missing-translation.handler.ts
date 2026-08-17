import {
  MissingTranslationHandler,
  MissingTranslationHandlerParams,
} from '@ngx-translate/core';

/**
 * Renders a readable label when a translation key has no entry.
 *
 * Menu labels are camelCase keys built by MenuBuilderService from `form_name`, and ngx-translate
 * returns the key itself when it finds no translation. Four PUR forms had no entry, so the sidebar
 * and breadcrumb displayed `goodsReceiptNote` and `landedCost` verbatim — the raw identifier, in
 * front of the user.
 *
 * The keys are added, but any form added later would hit the same thing, and a missing translation
 * should degrade to something readable rather than leak an identifier. `goodsReceiptNote` becomes
 * "Goods Receipt Note"; a dotted key falls back to its last segment.
 */
export class HumanisingMissingTranslationHandler implements MissingTranslationHandler {
  handle(params: MissingTranslationHandlerParams): string {
    const key = params.key ?? '';
    if (!key) return '';

    const leaf = key.split('.').pop() ?? key;

    return leaf
      // camelCase / PascalCase boundaries, and letter-to-digit runs
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/([A-Za-z])(\d)/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, (c) => c.toUpperCase());
  }
}

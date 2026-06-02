import { Injectable, inject, signal } from '@angular/core';
import { CoreFileApiService } from './core-file-api.service';
import { CurrencySettingsService } from './currency-settings.service';

/**
 * # AppBootstrapService — single global session-data context
 *
 * Every piece of data that must be loaded **once per session** and made
 * available everywhere in the ERP lives here.  Components and services read
 * signals from this service rather than calling APIs directly.
 *
 * ## What it manages
 * | Data | Signal | Cache key |
 * |------|--------|-----------|
 * | Company logo | `companyLogoDataUrl` | `sme_company_logo` (sessionStorage) |
 * | Base currency / number format | via `CurrencySettingsService` | `sme_currency_settings` (sessionStorage) |
 *
 * ## Call sites (three, no more)
 * | Where | When | Method |
 * |-------|------|--------|
 * | `AuthService.setSession()` | Fresh login / branch switch / company switch | `bootstrap()` |
 * | `APP_INITIALIZER` (app.config.ts) | Page refresh — auth token found in storage | `loadFromStorage()` |
 * | `AuthService.logout()` | Logout | `clear()` |
 *
 * ## Targeted refresh (after form saves)
 * - SYS1001 logo upload success → call `reloadLogo()`
 * - SYS1004 base currency save → call `reloadCurrency()`
 */
@Injectable({ providedIn: 'root' })
export class AppBootstrapService {
  private readonly fileApi  = inject(CoreFileApiService);
  private readonly currency = inject(CurrencySettingsService);

  private static readonly LOGO_KEY = 'sme_company_logo';

  // ── Public signals ──────────────────────────────────────────────────────────

  /**
   * Base64 data-URL for the company logo (e.g. `data:image/png;base64,...`).
   * {@code null} until loaded or when no logo has been uploaded.
   *
   * Stored as base64 — not a blob URL — so it survives sessionStorage round-trips
   * and page refreshes without needing another API call.
   *
   * ### Usage
   * ```ts
   * private bootstrap = inject(AppBootstrapService);
   * readonly logoUrl = this.bootstrap.companyLogoDataUrl;
   * ```
   */
  readonly companyLogoDataUrl = signal<string | null>(null);

  /** Delegates to CurrencySettingsService — shortcut for templates/services. */
  readonly baseCurrency = this.currency.baseCurrency;

  /** True once base-currency has been loaded (or gracefully failed). */
  readonly isCurrencyLoaded = this.currency.isLoaded;

  // ── Bootstrap entry points ──────────────────────────────────────────────────

  /**
   * Called by `AuthService.setSession()` after every successful login,
   * branch switch, or company switch.
   *
   * Always fetches fresh from the API (ignores any stale cache from the
   * previous session or company context).
   */
  bootstrap(): void {
    this._fetchLogo();                          // always fresh — company may have changed
    this.currency.loadSettings(true);           // forceRefresh = true
  }

  /**
   * Called by `APP_INITIALIZER` after `auth.initialize()` succeeds on a page
   * refresh.  Reads from sessionStorage first; only hits the API if the cache
   * is absent.
   */
  loadFromStorage(): void {
    this._restoreLogo();
    this.currency.loadSettings(false);          // forceRefresh = false → cache-first
  }

  // ── Targeted refresh ────────────────────────────────────────────────────────

  /**
   * Invalidate the logo cache and re-fetch from the server.
   * Call from SYS1001 after a logo upload or deletion succeeds.
   */
  reloadLogo(): void {
    sessionStorage.removeItem(AppBootstrapService.LOGO_KEY);
    this.companyLogoDataUrl.set(null);
    this._fetchLogo();
  }

  /**
   * Invalidate the currency cache and re-fetch from the server.
   * Call from SYS1004 after a base-currency save succeeds.
   */
  reloadCurrency(): void {
    this.currency.reloadSettings();
  }

  // ── Logout ──────────────────────────────────────────────────────────────────

  /**
   * Wipe all cached bootstrap data and reset every signal to its zero state.
   * Called by `AuthService.logout()`.
   */
  clear(): void {
    sessionStorage.removeItem(AppBootstrapService.LOGO_KEY);
    this.companyLogoDataUrl.set(null);
    this.currency.clearCache();
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private _restoreLogo(): void {
    const cached = sessionStorage.getItem(AppBootstrapService.LOGO_KEY);
    if (cached) {
      this.companyLogoDataUrl.set(cached);      // served from cache — no API call
    } else {
      this._fetchLogo();                        // cache miss — fetch from server
    }
  }

  private _fetchLogo(): void {
    // entity_type 1 = CompanyLogo (scoped to the JWT company automatically)
    this.fileApi.list(1).subscribe({
      next: res => {
        const primary = res?.data?.find(f => f.is_primary) ?? res?.data?.[0];
        if (!primary) {
          this.companyLogoDataUrl.set(null);
          return;
        }

        this.fileApi.fetchAsBlob(primary.serve_path).subscribe({
          next: blob => this._persistLogoBlob(blob),
          error: () => this.companyLogoDataUrl.set(null),
        });
      },
      error: () => this.companyLogoDataUrl.set(null),
    });
  }

  /**
   * Convert a Blob to a base64 data-URL, update the signal, and persist to
   * sessionStorage so page refreshes skip the API entirely.
   */
  private _persistLogoBlob(blob: Blob): void {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.companyLogoDataUrl.set(dataUrl);
      try {
        sessionStorage.setItem(AppBootstrapService.LOGO_KEY, dataUrl);
      } catch {
        // sessionStorage quota exceeded (logo > 5 MB?) — signal still works in-memory
      }
    };
    reader.readAsDataURL(blob);
  }
}

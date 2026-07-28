import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { AppConfigService } from './app-config.service';
import { CurrencySettingsService, IBaseCurrencySettings } from './currency-settings.service';
import { CommonDataService } from '../../shared/services/common-data.service';
import { ApiResponse, isSuccess } from '../models/response.model';
import { SKIP_LOADER } from '../interceptors/loader.interceptor';

interface AppBootstrapResponse {
  company_logo_data_url?: string | null;
  base_currency_settings?: IBaseCurrencySettings | null;
}

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
 * | Company logo | `companyLogoDataUrl` | `sme_company_logo` (localStorage) |
 * | Base currency / number format | via `CurrencySettingsService` | `sme_currency_settings` (localStorage) |
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
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);
  private readonly currency = inject(CurrencySettingsService);
  private readonly commonData = inject(CommonDataService);

  private static readonly LOGO_KEY = 'sme_company_logo';

  // ── Public signals ──────────────────────────────────────────────────────────

  /**
   * Base64 data-URL for the company logo (e.g. `data:image/png;base64,...`).
   * {@code null} until loaded or when no logo has been uploaded.
   *
   * Stored as base64 — not a blob URL — so it survives localStorage round-trips
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
    this.fetchBootstrap();
    this.commonData.loadCurrencies(true);
  }

  /**
   * Called by `APP_INITIALIZER` after `auth.initialize()` succeeds on a page
   * refresh.  Reads from localStorage first; only hits the API if the cache
   * is absent.
   */
  loadFromStorage(): void {
    const hasLogo = this.restoreLogo();
    const hasCurrency = this.currency.restoreFromCache();
    this.commonData.loadCurrencies();

    if (!hasLogo || !hasCurrency) {
      this.fetchBootstrap();
    }
  }

  // ── Targeted refresh ────────────────────────────────────────────────────────

  /**
   * Invalidate the logo cache and re-fetch from the server.
   * Call from SYS1001 after a logo upload or deletion succeeds.
   */
  reloadLogo(): void {
    localStorage.removeItem(AppBootstrapService.LOGO_KEY);
    this.companyLogoDataUrl.set(null);
    this.fetchBootstrap();
  }

  /**
   * Invalidate the currency cache and re-fetch from the server.
   * Call from SYS1004 after a base-currency save succeeds.
   */
  reloadCurrency(): void {
    this.fetchBootstrap();
  }

  // ── Logout ──────────────────────────────────────────────────────────────────

  /**
   * Wipe all cached bootstrap data and reset every signal to its zero state.
   * Called by `AuthService.logout()`.
   */
  clear(): void {
    localStorage.removeItem(AppBootstrapService.LOGO_KEY);
    this.companyLogoDataUrl.set(null);
    this.currency.clearCache();
    this.commonData.clearCurrenciesCache();
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private restoreLogo(): boolean {
    const cached = localStorage.getItem(AppBootstrapService.LOGO_KEY);
    if (cached) {
      this.companyLogoDataUrl.set(cached);      // served from cache — no API call
      return true;
    }
    return false;
  }

  private fetchBootstrap(): void {
    this.http.get<ApiResponse<AppBootstrapResponse>>(`${this.config.apiUrl}/app/bootstrap`, {
      context: new HttpContext().set(SKIP_LOADER, true),
    }).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.applyBootstrap(res.data);
          return;
        }
        this.applyBootstrap({});
      },
      error: () => this.applyBootstrap({}),
    });
  }

  private applyBootstrap(data: AppBootstrapResponse): void {
    this.persistLogoDataUrl(data.company_logo_data_url);
    this.currency.applySettingsFromBootstrap(data.base_currency_settings);
  }

  private persistLogoDataUrl(dataUrl: string | null | undefined): void {
    if (dataUrl === undefined) {
      return;
    }

    if (dataUrl) {
      this.companyLogoDataUrl.set(dataUrl);
      try {
        localStorage.setItem(AppBootstrapService.LOGO_KEY, dataUrl);
      } catch {
        // localStorage quota exceeded (logo > 5 MB?) — signal still works in-memory
      }
      return;
    }

    localStorage.removeItem(AppBootstrapService.LOGO_KEY);
    this.companyLogoDataUrl.set(null);
  }
}

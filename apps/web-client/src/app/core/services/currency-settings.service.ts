import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from './app-config.service';
import { AppSettingsService, NumberStyle } from './app-settings.service';
import { ApiResponse, isSuccess } from '../models/response.model';

export interface IBaseCurrencySettings {
  /** ISO 4217 code, e.g. "BDT" */
  currency_code:   string;
  currency_name:   string;
  /** Symbol shown before amounts, e.g. "৳" */
  currency_symbol: string;
  /** "International" (1,234.56) or "Indian" (1,23,456.78) */
  number_format:   string;
  /** Digits after the decimal point (0–4) */
  decimal_places:  number;
}

/**
 * Root-level service that owns the base-currency formatting settings.
 *
 * ### Caching
 * Results are stored in {@code sessionStorage} under the key {@code sme_currency_settings}.
 * On every page refresh the cache is read first — no API round-trip unless the cache
 * is absent (first login) or explicitly invalidated (after SYS1004 saves a new base currency).
 *
 * ### Call sites
 * - {@link AppBootstrapService.bootstrap} — fresh load after login / branch switch
 * - {@link AppBootstrapService.loadFromStorage} — cache-first load on page refresh
 * - {@link AppBootstrapService.reloadCurrency} — cache-busting reload after SYS1004 saves
 *
 * Do NOT call {@code loadSettings()} directly from layout components — the bootstrap
 * service orchestrates all session-level data loading.
 */
@Injectable({ providedIn: 'root' })
export class CurrencySettingsService {
  private readonly http        = inject(HttpClient);
  private readonly config      = inject(AppConfigService);
  private readonly appSettings = inject(AppSettingsService);

  private static readonly CACHE_KEY = 'sme_currency_settings';

  /** True once the first successful load completes (or gracefully fails). */
  readonly isLoaded     = signal(false);

  /** The currently active base-currency settings, null until loaded. */
  readonly baseCurrency = signal<IBaseCurrencySettings | null>(null);

  /**
   * Load base-currency settings.
   *
   * @param forceRefresh — when {@code true} skips the sessionStorage cache and always
   *   hits the API (use after login or after SYS1004 saves a new base currency).
   *   When {@code false} (default) the cache is used if present; the API is only called
   *   if the cache is empty.
   */
  loadSettings(forceRefresh = false): void {
    if (!forceRefresh && this.restoreFromCache()) {
      return;                              // served from cache, no API call
    }

    this.http
      .get<ApiResponse<IBaseCurrencySettings>>(
        `${this.config.apiUrl}/sys/currency/base-settings`,
      )
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            this.applySettingsFromBootstrap(res.data);
          } else {
            this.isLoaded.set(true);
          }
        },
        error: () => {
          // Fall back to defaults — do not break the app if SYS isn't configured yet.
          this.isLoaded.set(true);
        },
      });
  }

  restoreFromCache(): boolean {
    const cached = sessionStorage.getItem(CurrencySettingsService.CACHE_KEY);
    if (!cached) {
      return false;
    }

    try {
      const settings = JSON.parse(cached) as IBaseCurrencySettings;
      this.applySettings(settings);
      this.isLoaded.set(true);
      return true;
    } catch {
      sessionStorage.removeItem(CurrencySettingsService.CACHE_KEY);
      return false;
    }
  }

  applySettingsFromBootstrap(settings: IBaseCurrencySettings | null | undefined): void {
    if (settings) {
      this.applySettings(settings);
      try {
        sessionStorage.setItem(
          CurrencySettingsService.CACHE_KEY,
          JSON.stringify(settings),
        );
      } catch { /* sessionStorage quota exceeded - non-fatal */ }
    }
    this.isLoaded.set(true);
  }

  /**
   * Invalidate the sessionStorage cache and fetch fresh from the server.
   * Call after SYS1004 successfully saves a new base currency.
   */
  reloadSettings(): void {
    sessionStorage.removeItem(CurrencySettingsService.CACHE_KEY);
    this.loadSettings(true);
  }

  /**
   * Clear cached data on logout so the next session doesn't inherit
   * the previous user's currency settings.
   */
  clearCache(): void {
    sessionStorage.removeItem(CurrencySettingsService.CACHE_KEY);
    this.baseCurrency.set(null);
    this.isLoaded.set(false);
  }

  /**
   * Apply settings immediately (e.g. right after SYS_1004 saves a base currency).
   * Updates both the local signal and AppSettingsService in one call.
   */
  applySettings(d: IBaseCurrencySettings): void {
    this.baseCurrency.set(d);
    const numberStyle: NumberStyle =
      d.number_format?.toLowerCase() === 'indian' ? 'indian' : 'international';
    this.appSettings.patch({
      numberStyle,
      precision: d.decimal_places ?? 2,
    });
  }
}

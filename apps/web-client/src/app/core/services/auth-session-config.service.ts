import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, of, shareReplay, tap } from 'rxjs';
import { AuthConfigResponse, AuthDataService } from '../../features/auth/services/data.service';
import { StorageService } from './storage.service';
import { globalConstants } from '../constants/global.constants';

const DEFAULT_AUTH_CONFIG: AuthConfigResponse = {
  access_token_expiration_ms: 300000,
  refresh_token_expiration_ms: 604800000,
  access_token_refresh_before_ms: 30000,
  inactivity_timeout_ms: 900000,
};

const CONFIG_CACHE_KEY = 'sme_auth_config';

@Injectable({ providedIn: 'root' })
export class AuthSessionConfigService {
  private readonly authData = inject(AuthDataService);
  private readonly storageService = inject(StorageService);
  private readonly configState = signal<AuthConfigResponse>(DEFAULT_AUTH_CONFIG);
  private configRequest$?: Observable<AuthConfigResponse>;
  private loaded = false;

  readonly config = this.configState.asReadonly();

  constructor() {
    this.restoreFromCache();
  }

  load(): Observable<AuthConfigResponse> {
    if (this.loaded) {
      return of(this.configState());
    }

    if (this.restoreFromCache()) {
      return of(this.configState());
    }

    if (!this.configRequest$) {
      this.configRequest$ = this.authData.getConfig().pipe(
        tap((config) => {
          const normalized = this.normalize(config);
          this.configState.set(normalized);
          this.storageService.setItem(CONFIG_CACHE_KEY, normalized, globalConstants.authStorageScope);
          this.loaded = true;
        }),
        catchError(() => {
          this.configState.set(DEFAULT_AUTH_CONFIG);
          this.loaded = true;
          return of(DEFAULT_AUTH_CONFIG);
        }),
        shareReplay(1),
      );
    }
    return this.configRequest$;
  }

  hydrate(config: AuthConfigResponse | null | undefined): void {
    if (!config) {
      return;
    }
    const normalized = this.normalize(config);
    this.configState.set(normalized);
    this.storageService.setItem(CONFIG_CACHE_KEY, normalized, globalConstants.authStorageScope);
    this.loaded = true;
    this.configRequest$ = of(normalized);
  }

  clear(): void {
    this.storageService.removeItem(CONFIG_CACHE_KEY, globalConstants.authStorageScope);
    this.configState.set(DEFAULT_AUTH_CONFIG);
    this.loaded = false;
    this.configRequest$ = undefined;
  }

  private restoreFromCache(): boolean {
    const cached = this.storageService.getItem<AuthConfigResponse>(CONFIG_CACHE_KEY, globalConstants.authStorageScope);
    if (!cached) {
      return false;
    }
    const normalized = this.normalize(cached);
    this.configState.set(normalized);
    this.loaded = true;
    this.configRequest$ = of(normalized);
    return true;
  }

  private normalize(config: AuthConfigResponse): AuthConfigResponse {
    return {
      access_token_expiration_ms: this.positive(config.access_token_expiration_ms, DEFAULT_AUTH_CONFIG.access_token_expiration_ms),
      refresh_token_expiration_ms: this.positive(config.refresh_token_expiration_ms, DEFAULT_AUTH_CONFIG.refresh_token_expiration_ms),
      access_token_refresh_before_ms: this.positive(config.access_token_refresh_before_ms, DEFAULT_AUTH_CONFIG.access_token_refresh_before_ms),
      inactivity_timeout_ms: this.positive(config.inactivity_timeout_ms, DEFAULT_AUTH_CONFIG.inactivity_timeout_ms),
    };
  }

  private positive(value: number | null | undefined, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
  }
}

import { Injectable } from '@angular/core';

interface RuntimeEnv {
  apiUrl?:       string;
  production?:   boolean;
  version?:      string;
  enableDebug?:  boolean;
}

declare global {
  interface Window {
    __env?: RuntimeEnv;
  }
}

/**
 * Reads runtime configuration injected by `assets/config/env.js` BEFORE
 * the Angular bundle boots. Using runtime config (instead of build-time
 * `environment.ts`) lets us ship one bundle and switch APIs per
 * environment without rebuilding.
 */
@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private get env(): RuntimeEnv {
    return window.__env ?? {};
  }

  get apiUrl(): string {
    return this.env.apiUrl ?? 'http://localhost:8080/api/v1';
  }

  get production(): boolean {
    return this.env.production ?? window.location.hostname !== 'localhost';
  }

  get version(): string {
    return this.env.version ?? '1.0.0';
  }

  get enableDebug(): boolean {
    return !!this.env.enableDebug;
  }
}

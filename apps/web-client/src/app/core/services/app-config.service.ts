import { Injectable } from '@angular/core';

interface RuntimeEnv {
  apiUrl?:       string;
  production?:   boolean;
  version?:      string;
  hostname?:     string;
  enableDebug?:  boolean;
}

declare global {
  interface Window {
    __env?: RuntimeEnv;
  }
}

/**
 * Reads runtime configuration injected by `assets/config/env.js` BEFORE
 * the Angular bundle boots.
 */
@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private get env(): RuntimeEnv {
    return window.__env ?? {};
  }

  get apiUrl(): string {
    return this.env.apiUrl ?? '';
  }

  get production(): boolean {
    return !!this.env.production;
  }

  get version(): string {
    return this.env.version ?? '';
  }

  get hostname(): string {
    return this.env.hostname ?? '';
  }

  get enableDebug(): boolean {
    return !!this.env.enableDebug;
  }
}

import { Injectable } from '@angular/core';

export type StorageScope = 'local' | 'session';

/**
 * Thin, strictly-typed wrapper around browser storage with JSON
 * serialisation. We intentionally do NOT roll our own encryption — keeping
 * a "secret key" in the JS bundle gives no real protection against an
 * attacker with browser access. If at-rest secrecy is required, store
 * sensitive values server-side and use HttpOnly Secure cookies.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {

  setItem<T>(key: string, value: T | null | undefined, scope: StorageScope = 'local'): void {
    if (value === undefined || value === null) {
      this.removeItem(key, scope);
      return;
    }
    const storage = this.storage(scope);
    const payload = typeof value === 'string' ? value : JSON.stringify(value);
    storage.setItem(key, payload);
  }

  getItem<T>(key: string, scope: StorageScope = 'local'): T | null {
    const raw = this.storage(scope).getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      // Stored as a plain string (e.g. a JWT) — return as-is.
      return raw as unknown as T;
    }
  }

  removeItem(key: string, scope: StorageScope = 'local'): void {
    this.storage(scope).removeItem(key);
  }

  clear(scope: StorageScope = 'local'): void {
    this.storage(scope).clear();
  }

  private storage(scope: StorageScope): Storage {
    return scope === 'session' ? sessionStorage : localStorage;
  }
}

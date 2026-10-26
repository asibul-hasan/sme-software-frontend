import { Injectable, computed, inject, signal } from '@angular/core';
import { NotificationService } from './notification.service';

export type BackendMode = 'local' | 'remote';
export type BackendStatus = 'checking' | 'connected' | 'reconnecting' | 'offline';

export interface BackendEndpointConfig {
  localOrigin: string;
  remoteOrigin: string;
}

@Injectable({
  providedIn: 'root',
})
export class BackendDiscoveryService {
  private readonly notification = inject(NotificationService);

  // Configuration constants - static configured origin without multi-port probing
  readonly config: BackendEndpointConfig = {
    localOrigin: 'http://localhost:5275',
    remoteOrigin: 'https://asibul-07-infoaidtech.hf.space',
  };

  // State Signals
  readonly mode = signal<BackendMode>('local');
  readonly status = signal<BackendStatus>('checking');
  readonly currentOrigin = signal<string>(this.config.localOrigin);
  readonly activePort = signal<number | null>(5275);
  readonly latencyMs = signal<number | null>(null);
  readonly lastChecked = signal<Date>(new Date());
  readonly isPolling = signal<boolean>(false);

  // Computed API base URL: e.g. "http://localhost:5275/api/v1" or "https://asibul-07-infoaidtech.hf.space/api/v1"
  readonly currentApiBase = computed(() => `${this.currentOrigin()}/api/v1`);

  constructor() {
    // Determine origin based on hostname without making any auto /health calls
    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isLocalhost) {
      this.mode.set('local');
      this.currentOrigin.set(this.config.localOrigin);
      this.activePort.set(5275);
    } else {
      this.mode.set('remote');
      this.currentOrigin.set(this.config.remoteOrigin);
      this.activePort.set(null);
    }
  }

  /**
   * Initializes the backend discovery on application startup.
   * Completely avoids automated /health probes. Health is verified only on user click.
   */
  async initialize(): Promise<void> {
    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isLocalhost) {
      this.mode.set('local');
      this.currentOrigin.set(this.config.localOrigin);
      this.activePort.set(5275);
    } else {
      this.mode.set('remote');
      this.currentOrigin.set(this.config.remoteOrigin);
      this.activePort.set(null);
    }

    this.status.set('connected');
    this.lastChecked.set(new Date());
    this.isPolling.set(false);
  }

  /**
   * Tests health of a specific origin
   */
  async checkHealth(origin: string, timeoutMs = 1500): Promise<{ ok: boolean; latency: number }> {
    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${origin}/health`, {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors',
        headers: { Accept: 'application/json' },
      });

      clearTimeout(timeoutId);
      const latency = Math.round(performance.now() - start);

      if (response.ok) {
        return { ok: true, latency };
      }
      return { ok: false, latency };
    } catch {
      return { ok: false, latency: Math.round(performance.now() - start) };
    }
  }

  /**
   * Probes remote backend
   */
  async probeRemoteHealth(timeoutMs = 3000): Promise<{ ok: boolean; latency: number }> {
    return this.checkHealth(this.config.remoteOrigin, timeoutMs);
  }

  private isChecking = false;

  /**
   * Manual trigger - called when developer explicitly clicks the button.
   * Probes health of current backend and connects.
   */
  async recheckNow(): Promise<void> {
    if (this.isChecking) return;
    this.isChecking = true;
    this.status.set('checking');

    try {
      const origin = this.currentOrigin();
      const result = await this.checkHealth(origin, 3000);

      if (result.ok) {
        this.status.set('connected');
        this.latencyMs.set(result.latency);
        this.lastChecked.set(new Date());
        this.notification.success(
          'Connected',
          `Connected to ${this.mode() === 'local' ? 'Local' : 'Live'} backend.`
        );
      } else {
        this.status.set('offline');
        this.notification.error(
          'Connection Failed',
          `Could not connect to ${this.mode() === 'local' ? 'Local' : 'Live'} backend at ${origin}.`
        );
      }
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Toggles between local and remote backend mode (for developers)
   */
  async toggleMode(): Promise<void> {
    const nextMode: BackendMode = this.mode() === 'local' ? 'remote' : 'local';
    await this.switchMode(nextMode);
  }

  /**
   * Manually switch mode
   */
  async switchMode(target: BackendMode): Promise<void> {
    if (target === 'local') {
      this.mode.set('local');
      this.currentOrigin.set(this.config.localOrigin);
      this.activePort.set(5275);
    } else {
      this.mode.set('remote');
      this.currentOrigin.set(this.config.remoteOrigin);
      this.activePort.set(null);
    }
    await this.recheckNow();
  }

  /**
   * Handles immediate connection failure
   */
  handleConnectionFailure(failedUrl?: string): void {
    if (this.mode() === 'local') {
      console.warn(`[BackendDiscovery] Local backend unreachable (${failedUrl || this.currentOrigin()}). Failing over to remote...`);
      this.mode.set('remote');
      this.currentOrigin.set(this.config.remoteOrigin);
      this.activePort.set(null);
      this.status.set('connected');
      this.lastChecked.set(new Date());

      this.notification.warning(
        'Switched to Cloud Live Backend',
        'Local backend is not responding. Traffic routed to remote server.'
      );
    }
  }
}

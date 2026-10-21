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

  private pollIntervalTimer: ReturnType<typeof setInterval> | null = null;
  private isChecking = false;

  constructor() {
    this.setupWindowListeners();
  }

  /**
   * Initializes the backend discovery on application startup.
   * Checks configured localOrigin directly without arbitrary port probing.
   */
  async initialize(): Promise<void> {
    this.status.set('checking');

    const localResult = await this.checkHealth(this.config.localOrigin, 1500);

    if (localResult.ok) {
      this.mode.set('local');
      this.currentOrigin.set(this.config.localOrigin);
      this.activePort.set(5275);
      this.latencyMs.set(localResult.latency);
      this.status.set('connected');
      console.log(`[BackendDiscovery] Connected to local backend at ${this.config.localOrigin} (${localResult.latency}ms)`);
    } else {
      // Fallback to configured remote live backend
      this.mode.set('remote');
      this.currentOrigin.set(this.config.remoteOrigin);
      this.activePort.set(null);
      this.status.set('connected');
      console.log(`[BackendDiscovery] Connected to live backend at ${this.config.remoteOrigin}`);

      // Verify remote health in background
      this.probeRemoteHealth(3000).then(res => {
        if (res.ok) {
          this.latencyMs.set(res.latency);
        }
      });
    }

    this.lastChecked.set(new Date());
    this.startPolling();
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

  /**
   * Starts periodic health monitoring on the active origin
   */
  startPolling(intervalMs = 15000): void {
    if (this.pollIntervalTimer) {
      clearInterval(this.pollIntervalTimer);
    }

    this.isPolling.set(true);

    this.pollIntervalTimer = setInterval(() => {
      this.pollCycle();
    }, intervalMs);
  }

  /**
   * Single poll cycle logic
   */
  async pollCycle(): Promise<void> {
    if (this.isChecking) return;
    this.isChecking = true;

    try {
      if (this.mode() === 'remote') {
        const localCheck = await this.checkHealth(this.config.localOrigin, 1200);

        if (localCheck.ok) {
          this.mode.set('local');
          this.currentOrigin.set(this.config.localOrigin);
          this.activePort.set(5275);
          this.latencyMs.set(localCheck.latency);
          this.status.set('connected');
          this.lastChecked.set(new Date());

          console.log(`[BackendDiscovery] Local backend detected at ${this.config.localOrigin}. Switched to local.`);
          this.notification.success(
            'Reconnected to Localhost',
            `Local backend detected at ${this.config.localOrigin}. Switched traffic back to local server.`
          );
        }
      } else {
        const currentOrigin = this.currentOrigin();
        const check = await this.checkHealth(currentOrigin, 1200);

        if (check.ok) {
          this.latencyMs.set(check.latency);
          this.status.set('connected');
        } else {
          this.handleConnectionFailure(currentOrigin);
        }
        this.lastChecked.set(new Date());
      }
    } finally {
      this.isChecking = false;
    }
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
        'Local backend is not responding. Traffic routed to remote server (will auto-reconnect when local is online).'
      );
    }
  }

  /**
   * Manual trigger
   */
  async recheckNow(): Promise<void> {
    this.status.set('checking');
    await this.pollCycle();
    if (this.status() === 'checking') {
      this.status.set('connected');
    }
  }

  /**
   * Manually switch mode
   */
  switchMode(target: BackendMode): void {
    if (target === 'local') {
      this.mode.set('local');
      this.currentOrigin.set(this.config.localOrigin);
      this.activePort.set(5275);
    } else {
      this.mode.set('remote');
      this.currentOrigin.set(this.config.remoteOrigin);
      this.activePort.set(null);
    }
    this.recheckNow();
  }

  private setupWindowListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('focus', () => {
      this.pollCycle();
    });

    window.addEventListener('online', () => {
      this.pollCycle();
    });
  }
}

import { Injectable, computed, inject, signal } from '@angular/core';
import { NotificationService } from './notification.service';

export type BackendMode = 'local' | 'remote';
export type BackendStatus = 'checking' | 'connected' | 'reconnecting' | 'offline';

export interface BackendEndpointConfig {
  localOrigin: string;
  candidatePorts: number[];
  remoteOrigin: string;
}

@Injectable({
  providedIn: 'root',
})
export class BackendDiscoveryService {
  private readonly notification = inject(NotificationService);

  // Configuration constants
  readonly config: BackendEndpointConfig = {
    localOrigin: 'http://localhost:5275',
    candidatePorts: [5275, 5000, 8080],
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
   * Probes localhost first (with a short timeout).
   * If local is active -> connects to local.
   * Else -> connects to Hugging Face live.
   * Starts background reconnect polling.
   */
  async initialize(): Promise<void> {
    this.status.set('checking');

    const localFound = await this.probeLocalCandidates(1500);

    if (localFound) {
      this.mode.set('local');
      this.currentOrigin.set(localFound.origin);
      this.activePort.set(localFound.port);
      this.latencyMs.set(localFound.latency);
      this.status.set('connected');
      console.log(`[BackendDiscovery] Connected to local backend at ${localFound.origin} (${localFound.latency}ms)`);
    } else {
      // Fallback to Hugging Face live backend
      this.mode.set('remote');
      this.currentOrigin.set(this.config.remoteOrigin);
      this.activePort.set(null);
      this.status.set('connected');
      console.log(`[BackendDiscovery] Localhost unreachable. Connected to Hugging Face live at ${this.config.remoteOrigin}`);

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
   * Tests health of a specific local port
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
   * Probes candidate local ports in order (5275, 5000, 8080)
   */
  private async probeLocalCandidates(timeoutMs = 1500): Promise<{ origin: string; port: number; latency: number } | null> {
    for (const port of this.config.candidatePorts) {
      const origin = `http://localhost:${port}`;
      const result = await this.checkHealth(origin, timeoutMs);
      if (result.ok) {
        return { origin, port, latency: result.latency };
      }
    }
    return null;
  }

  /**
   * Probes Hugging Face live backend
   */
  async probeRemoteHealth(timeoutMs = 3000): Promise<{ ok: boolean; latency: number }> {
    return this.checkHealth(this.config.remoteOrigin, timeoutMs);
  }

  /**
   * Starts periodic polling:
   * When connected to Remote -> repeatedly polls localhost to reconnect as soon as it turns on.
   * When connected to Local -> keeps latency updated and verifies health.
   */
  startPolling(intervalMs = 10000): void {
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
        // While running on remote, check if localhost backend has become available!
        const localFound = await this.probeLocalCandidates(1200);

        if (localFound) {
          // Localhost is back! Reconnect to localhost
          const prevOrigin = this.currentOrigin();
          this.mode.set('local');
          this.currentOrigin.set(localFound.origin);
          this.activePort.set(localFound.port);
          this.latencyMs.set(localFound.latency);
          this.status.set('connected');
          this.lastChecked.set(new Date());

          console.log(`[BackendDiscovery] Localhost detected! Reconnected to ${localFound.origin} (was on ${prevOrigin})`);
          this.notification.success(
            'Reconnected to Localhost',
            `Local backend detected on port ${localFound.port}. Switched traffic back to local server.`
          );
        }
      } else {
        // While running on local, verify local is still responding
        const currentPort = this.activePort() || 5275;
        const currentOrigin = this.currentOrigin();
        const check = await this.checkHealth(currentOrigin, 1200);

        if (check.ok) {
          this.latencyMs.set(check.latency);
          this.status.set('connected');
        } else {
          // Localhost stopped responding! Fallback to Hugging Face
          this.handleConnectionFailure(currentOrigin);
        }
        this.lastChecked.set(new Date());
      }
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Handles immediate connection failure (e.g. from errorInterceptor when an API call gets connection refused)
   */
  handleConnectionFailure(failedUrl?: string): void {
    if (this.mode() === 'local') {
      console.warn(`[BackendDiscovery] Local backend unreachable (${failedUrl || this.currentOrigin()}). Failing over to Hugging Face...`);
      
      this.mode.set('remote');
      this.currentOrigin.set(this.config.remoteOrigin);
      this.activePort.set(null);
      this.status.set('connected');
      this.lastChecked.set(new Date());

      this.notification.warning(
        'Switched to Cloud Live Backend',
        'Local backend is not responding. Traffic routed to Hugging Face live server (will auto-reconnect when local is online).'
      );
    }
  }

  /**
   * Manual trigger (e.g. user clicks status pill in header to refresh status)
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

    // Immediately re-check whenever user returns to the browser tab
    window.addEventListener('focus', () => {
      this.pollCycle();
    });

    // Re-check when internet connection recovers
    window.addEventListener('online', () => {
      this.pollCycle();
    });
  }
}

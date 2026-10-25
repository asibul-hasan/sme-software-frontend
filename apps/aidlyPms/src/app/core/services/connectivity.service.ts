import { Injectable, inject, signal, computed } from '@angular/core';
import { BackendDiscoveryService } from './backend-discovery.service';

export type NetworkStatus = 'online' | 'offline';

@Injectable({
  providedIn: 'root',
})
export class ConnectivityService {
  private readonly discovery = inject(BackendDiscoveryService);

  readonly isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  readonly status = computed<NetworkStatus>(() => (this.isOnline() ? 'online' : 'offline'));
  readonly lastChecked = signal<Date>(new Date());

  private consecutiveFailures = 0;
  private isChecking = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.initListeners();
    this.startPolling();
  }

  private initListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.checkConnectivity();
    });

    window.addEventListener('offline', () => {
      this.consecutiveFailures = 2;
      this.isOnline.set(false);
    });
  }

  private startPolling(): void {
    if (typeof window === 'undefined') return;

    // Probe every 3 seconds
    this.pollTimer = setInterval(() => {
      this.checkConnectivity();
    }, 3000);
  }

  async checkConnectivity(): Promise<boolean> {
    if (this.isChecking) return this.isOnline();
    this.isChecking = true;

    try {
      // If browser itself reports offline, immediately set offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        this.consecutiveFailures = 2;
        this.isOnline.set(false);
        this.lastChecked.set(new Date());
        return false;
      }

      const origin = this.discovery.currentOrigin();
      const probeUrl = `${origin}/api/v1/cfg/sale-configs`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      try {
        const response = await fetch(probeUrl, {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
        });
        clearTimeout(timeoutId);

        // Any HTTP response (200, 401, 403, etc.) proves backend is reachable
        this.consecutiveFailures = 0;
        this.isOnline.set(true);
        this.lastChecked.set(new Date());
        return true;
      } catch {
        clearTimeout(timeoutId);
        this.consecutiveFailures++;
        // Hysteresis: 2 consecutive failures triggers offline
        if (this.consecutiveFailures >= 2) {
          this.isOnline.set(false);
        }
        this.lastChecked.set(new Date());
        return false;
      }
    } finally {
      this.isChecking = false;
    }
  }

  ngOnDestroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}

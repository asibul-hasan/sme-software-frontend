import { Injectable, signal, computed } from '@angular/core';

export type NetworkStatus = 'online' | 'offline';

@Injectable({
  providedIn: 'root',
})
export class ConnectivityService {
  readonly isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  readonly status = computed<NetworkStatus>(() => (this.isOnline() ? 'online' : 'offline'));
  readonly lastChecked = signal<Date>(new Date());

  constructor() {
    this.initListeners();
  }

  private initListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline.set(true);
      this.lastChecked.set(new Date());
    });

    window.addEventListener('offline', () => {
      this.isOnline.set(false);
      this.lastChecked.set(new Date());
    });
  }

  setOnline(online: boolean): void {
    this.isOnline.set(online);
    this.lastChecked.set(new Date());
  }
}

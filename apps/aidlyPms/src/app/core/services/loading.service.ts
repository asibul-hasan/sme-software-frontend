import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private readonly activeRequests = signal<number>(0);

  readonly isLoading = signal<boolean>(false);

  startLoading(): void {
    const current = this.activeRequests() + 1;
    this.activeRequests.set(current);
    this.isLoading.set(true);
  }

  stopLoading(): void {
    const current = Math.max(0, this.activeRequests() - 1);
    this.activeRequests.set(current);
    if (current === 0) {
      this.isLoading.set(false);
    }
  }
}

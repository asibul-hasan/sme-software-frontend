import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private activeRequests = 0;
  public isLoading = signal<boolean>(false);

  show() {
    if (this.activeRequests === 0) {
      this.isLoading.set(true);
    }
    this.activeRequests++;
  }

  hide() {
    this.activeRequests--;
    if (this.activeRequests <= 0) {
      this.activeRequests = 0;
      this.isLoading.set(false);
    }
  }
}

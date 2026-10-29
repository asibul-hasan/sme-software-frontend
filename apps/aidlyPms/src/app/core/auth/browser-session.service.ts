import { Injectable, inject } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { BackendDiscoveryService } from '../services/backend-discovery.service';

@Injectable({ providedIn: 'root' })
export class BrowserSessionService {
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly discovery = inject(BackendDiscoveryService);
  private csrfRequest?: Observable<string>;
  private csrfBase = '';

  isApiRequest(url: string): boolean {
    const base = this.discovery.currentApiBase();
    return url === base || url.startsWith(`${base}/`);
  }

  csrfToken(): Observable<string> {
    const base = this.discovery.currentApiBase();
    if (!this.csrfRequest || this.csrfBase !== base) {
      this.csrfBase = base;
      this.csrfRequest = this.http.get<{ data: { requestToken: string } }>(`${base}/auth/csrf`, { withCredentials: true }).pipe(
        map(response => response.data.requestToken),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.csrfRequest;
  }

  resetCsrf(): void { this.csrfRequest = undefined; }
}

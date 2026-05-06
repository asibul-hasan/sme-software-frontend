import { Injectable } from '@angular/core';

interface EnvConfig {
  apiUrlLocal: string;
  apiUrlLive: string;
  enableDebug?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  private get env(): any {
    return (window as any).__env || {};
  }

  get apiUrl(): string {
    return this.env.apiUrl || 'http://localhost:8080/api/v1';
  }

  get production(): boolean {
    return this.env.production || window.location.hostname !== 'localhost';
  }

  get version(): string {
    return this.env.version || '1.0.0';
  }
}

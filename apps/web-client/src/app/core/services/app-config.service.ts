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
  get apiUrl(): string {
    const env = (window as any).__env;
    return env?.apiUrl;
  }

  get production(): boolean {
    return window.location.hostname !== 'localhost';
  }
}

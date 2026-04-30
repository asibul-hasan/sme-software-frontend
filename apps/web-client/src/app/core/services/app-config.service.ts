import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  private config: any = {};

  constructor(private http: HttpClient) {}

  async loadConfig(): Promise<any> {
    try {
      const data = await firstValueFrom(this.http.get('/assets/config.json'));
      this.config = data;
      return this.config;
    } catch (err) {
      console.error('Failed to load configuration from /assets/config.json', err);
      return {};
    }
  }

  get apiUrl(): string {
    return this.config.apiUrl || '';
  }
}

import { Injectable, signal } from '@angular/core';
import { AppGlobals } from '../app-globals';

export type NumberStyle = 'international' | 'indian';

export interface IAppSettings {
  /** Base date format token used by date pipes (Angular DatePipe format string). */
  dateFormat:   string;
  /** How large numbers are grouped: international (1,234,567) or indian (12,34,567). */
  numberStyle:  NumberStyle;
  /** Default decimal places for number/currency display. */
  precision:    number;
  /** IANA timezone identifier used by dateTimeGmt pipe. */
  timezone:     string;
}

/**
 * Holds application-level formatting preferences that drive the date and number
 * pipes. Values are hardcoded here until the setup screen persists them via API.
 *
 * To change formatting globally, update the signal once (e.g. after a settings
 * API response) and every pipe that reads `current()` will update automatically.
 */
@Injectable({ providedIn: 'root' })
export class AppSettingsService {
  readonly current = signal<IAppSettings>({
    dateFormat:  'dd/MM/yyyy',
    numberStyle: 'international',
    precision:   2,
    timezone:    'Asia/Dhaka',
  });

  /** Patch one or more settings without replacing the whole object. */
  patch(partial: Partial<IAppSettings>): void {
    this.current.update(s => {
      const next = { ...s, ...partial };
      AppGlobals.settings = next;
      return next;
    });
  }
}

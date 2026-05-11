import type { User } from './models/user.model';
import type { IAppSettings } from './services/app-settings.service';

/**
 * Application-wide runtime globals — a plain imported object, not a service.
 *
 * Import anywhere without injection:
 *
 *   import { AppGlobals } from '../../core/app-globals';
 *
 *   AppGlobals.user.company_no
 *   AppGlobals.user.branch_no
 *   AppGlobals.settings.precision
 *   AppGlobals.settings.numberStyle
 *
 * Values are populated automatically:
 *   - user     → set by AuthContextService on login / branch-switch / logout
 *   - settings → set by AppSettingsService on init / patch
 *
 * IMPORTANT: Read properties at the point of use — do not cache the sub-object:
 *   ✓  AppGlobals.user.branch_no          — reads live value every call
 *   ✗  const u = AppGlobals.user          — u is frozen at that moment;
 *                                            branch-switch replaces AppGlobals.user
 *                                            with a new object, u stays stale
 */
export const AppGlobals: {
  user:     User;
  settings: IAppSettings;
} = {
  user: {} as User,
  settings: {
    dateFormat:  'dd/MM/yyyy',
    numberStyle: 'international',
    precision:   2,
    timezone:    'Asia/Dhaka',
  },
};

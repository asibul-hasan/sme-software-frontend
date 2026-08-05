import { Injectable, NgZone, effect, inject, signal } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subscription, fromEvent, merge, timer, EMPTY } from 'rxjs';
import { switchMap, throttleTime, tap, catchError, retry } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { AuthContextService } from './auth-context.service';
import { AuthSessionConfigService } from './auth-session-config.service';
import { SessionLockComponent } from '../../layout/components/session-lock/session-lock.component';

/** How long to wait before retrying a failed refresh attempt (ms). */
const REFRESH_RETRY_DELAY_MS = 10_000;
/** Max consecutive refresh retries before giving up and logging out. */
const REFRESH_MAX_RETRIES = 3;

/**
 * Manages two ambient session behaviours for authenticated users:
 *
 *  1. Dynamic token refresh — schedules a refresh request based on the JWT 'exp'
 *     claim so users never get a hard 401 mid-action.
 *  2. Inactivity lock — after {@link INACTIVITY_TIMEOUT} of no input we open
 *     a blocking lock dialog.
 */
@Injectable({ providedIn: 'root' })
export class SessionManagerService {
  private readonly authService  = inject(AuthService);
  private readonly authContext  = inject(AuthContextService);
  private readonly authConfig   = inject(AuthSessionConfigService);
  private readonly dialog       = inject(MatDialog);
  private readonly zone         = inject(NgZone);

  private refreshSub?:    Subscription;
  private inactivitySub?: Subscription;
  private configSub?:     Subscription;
  private lockDialogRef: MatDialogRef<SessionLockComponent> | null = null;

  readonly isLocked = signal(false);

  constructor() {
    effect(() => {
      const authed = this.authContext.isAuthenticated();
      const locked = this.isLocked();

      if (authed && !locked) {
        this.startTimers();
      } else {
        this.stopTimers();
      }
    });
  }

  init(): void {
    // Work done by constructor effect.
  }

  private startTimers(): void {
    this.stopTimers();
    this.startInactivityTimer();

    // Load the auth config (from cache or API) and schedule the first refresh.
    // If the config request fails or hangs, use defaults so the refresh chain
    // is not blocked — the timer still fires and the interceptor handles 401s.
    this.configSub = this.authConfig.load().subscribe({
      next: () => this.scheduleNextRefresh(),
      error: () => this.scheduleNextRefresh(),
    });
  }

  /**
   * Calculates the delay until the access token expires and schedules
   * a refresh request. Refresh lead time is supplied by the backend
   * from application.yaml so token timing is managed in one place.
   *
   * The refresh chain is self-healing: on transient errors (network hiccup,
   * backend timeout) it retries up to REFRESH_MAX_RETRIES times with a
   * short delay. Only hard failures (refresh token expired) trigger logout.
   */
  private scheduleNextRefresh(): void {
    this.refreshSub?.unsubscribe();

    const token = this.authService.getToken();
    if (!token) return;

    const expiryDate = this.authContext.getTokenExpirationDate(token);
    if (!expiryDate) {
      console.warn('[SessionManager] Token has no exp claim — cannot schedule proactive refresh. Falling back to reactive 401 handling.');
      return;
    }

    const now = new Date().getTime();
    const expiry = expiryDate.getTime();

    const configured = this.authConfig.config();
    const maxBuffer = Math.max(0, configured.access_token_expiration_ms - 1000);
    const buffer = Math.min(configured.access_token_refresh_before_ms, maxBuffer);
    const delay = Math.max(0, expiry - now - buffer);

    console.debug(`[SessionManager] Next token refresh scheduled in ${Math.round(delay / 1000)}s`);

    this.refreshSub = timer(delay).pipe(
      switchMap(() =>
        this.authService.refreshToken().pipe(
          // Transient errors: retry a few times before giving up.
          retry({ count: REFRESH_MAX_RETRIES, delay: REFRESH_RETRY_DELAY_MS }),
        )
      ),
      tap({
        next: (newToken) => {
          console.debug('[SessionManager] Token refreshed successfully. Scheduling next refresh.');
          this.scheduleNextRefresh();
        },
        error: (err) => {
          // All retries exhausted — session is unrecoverable.
          console.error('[SessionManager] Token refresh failed after retries:', err);
          this.authService.logout();
        },
      }),
      catchError(() => EMPTY),  // prevent double-handling; error already dealt with in tap
    ).subscribe();
  }

  private startInactivityTimer(): void {
    this.zone.runOutsideAngular(() => {
      const activity$ = merge(
        fromEvent(window, 'mousemove'),
        fromEvent(window, 'keydown'),
        fromEvent(window, 'click'),
        fromEvent(window, 'scroll'),
        fromEvent(window, 'touchstart'),
      ).pipe(throttleTime(2000));

      this.inactivitySub = activity$
        .pipe(switchMap(() => timer(this.authConfig.config().inactivity_timeout_ms)))
        .subscribe(() => this.zone.run(() => this.lockScreen()));
    });
  }

  private stopTimers(): void {
    this.configSub?.unsubscribe();
    this.refreshSub?.unsubscribe();
    this.inactivitySub?.unsubscribe();
    this.configSub     = undefined;
    this.refreshSub    = undefined;
    this.inactivitySub = undefined;
  }

  private lockScreen(): void {
    if (this.isLocked() || !this.authContext.isAuthenticated()) return;

    this.isLocked.set(true);
    this.inactivitySub?.unsubscribe();
    this.inactivitySub = undefined;

    this.lockDialogRef = this.dialog.open(SessionLockComponent, {
      disableClose:  true,
      backdropClass: 'session-lock-backdrop',
      panelClass:    'session-lock-panel',
    });

    this.lockDialogRef.afterClosed().subscribe((unlocked: boolean) => {
      this.lockDialogRef = null;
      if (unlocked) {
        this.isLocked.set(false);
      } else {
        this.authService.logout();
      }
    });
  }
}

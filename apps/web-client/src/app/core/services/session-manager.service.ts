import { Injectable, NgZone, effect, inject, signal } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subscription, fromEvent, merge, timer } from 'rxjs';
import { switchMap, throttleTime, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { AuthContextService } from './auth-context.service';
import { SessionLockComponent } from '../../layout/components/session-lock/session-lock.component';

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
  private readonly dialog       = inject(MatDialog);
  private readonly zone         = inject(NgZone);

  private readonly INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

  private refreshSub?:    Subscription;
  private inactivitySub?: Subscription;
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
    this.scheduleNextRefresh();
    this.startInactivityTimer();
  }

  /**
   * Calculates the delay until the access token expires and schedules
   * a refresh request. We refresh 30 seconds before the actual 'exp'
   * claim to account for network latency and clock skew.
   */
  private scheduleNextRefresh(): void {
    this.refreshSub?.unsubscribe();

    const token = this.authService.getToken();
    if (!token) return;

    const expiryDate = this.authContext.getTokenExpirationDate(token);
    if (!expiryDate) return;

    const now = new Date().getTime();
    const expiry = expiryDate.getTime();

    // Schedule refresh 30 seconds before expiry, or immediately if already near/past.
    const buffer = 30 * 1000;
    const delay = Math.max(0, expiry - now - buffer);

    console.debug(`[SessionManager] Next token refresh scheduled in ${Math.round(delay / 1000)}s`);

    this.refreshSub = timer(delay).pipe(
      switchMap(() => this.authService.refreshToken()),
      tap(() => this.scheduleNextRefresh()) // Recursively schedule the next one
    ).subscribe({
      error: (err) => {
        console.error('[SessionManager] Token refresh failed:', err);
        // If refresh fails (e.g. refresh token also expired), we logout.
        this.authService.logout();
      }
    });
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
        .pipe(switchMap(() => timer(this.INACTIVITY_TIMEOUT)))
        .subscribe(() => this.zone.run(() => this.lockScreen()));
    });
  }

  private stopTimers(): void {
    this.refreshSub?.unsubscribe();
    this.inactivitySub?.unsubscribe();
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

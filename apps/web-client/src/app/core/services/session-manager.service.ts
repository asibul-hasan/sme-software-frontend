import { Injectable, NgZone, effect, inject, signal } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subscription, fromEvent, merge, timer } from 'rxjs';
import { switchMap, throttleTime } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { AuthContextService } from './auth-context.service';
import { SessionLockComponent } from '../../layout/components/session-lock/session-lock.component';

/**
 * Manages two ambient session behaviours for authenticated users:
 *
 *  1. Sliding token refresh — refreshes the JWT every {@link REFRESH_INTERVAL}
 *     so users never get a hard 401 mid-action.
 *  2. Inactivity lock — after {@link INACTIVITY_TIMEOUT} of no input we open
 *     a blocking lock dialog. The user must re-enter their password to unlock,
 *     or session is terminated.
 *
 * The previous implementation polled `interval(1000)` indefinitely to watch
 * the auth state. This version uses a single Angular `effect()` that reacts
 * to changes in the `isAuthenticated` signal — zero polling.
 */
@Injectable({ providedIn: 'root' })
export class SessionManagerService {
  private readonly authService  = inject(AuthService);
  private readonly authContext  = inject(AuthContextService);
  private readonly dialog       = inject(MatDialog);
  private readonly zone         = inject(NgZone);

  private readonly REFRESH_INTERVAL  = 5  * 60 * 1000;  // 5 minutes
  private readonly INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

  private refreshSub?:    Subscription;
  private inactivitySub?: Subscription;
  private lockDialogRef: MatDialogRef<SessionLockComponent> | null = null;

  readonly isLocked = signal(false);

  constructor() {
    // Single reactive subscription wired up once at service construction.
    // Replaces the previous `interval(1000)` polling pair.
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

  /**
   * Marker hook for {@link APP_INITIALIZER} — ensures the service is
   * eagerly instantiated at app boot so the constructor effect activates
   * before any component subscribes.
   */
  init(): void {
    // Intentionally empty — work is done by the constructor effect above.
  }

  private startTimers(): void {
    this.stopTimers();

    // 1. Sliding token refresh — rotates both tokens before the AT expires.
    this.refreshSub = timer(this.REFRESH_INTERVAL, this.REFRESH_INTERVAL)
      .pipe(switchMap(() => this.authService.refreshToken()))
      .subscribe();

    // 2. Inactivity detection — runs outside Angular zone to avoid spurious CD.
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

    // Note: refresh timer keeps running while locked so the user does not
    // come back to a 401 storm after unlocking.
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

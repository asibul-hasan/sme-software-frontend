import { Injectable, inject, NgZone, signal } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { interval, fromEvent, merge, Subscription, BehaviorSubject } from 'rxjs';
import { switchMap, throttleTime, filter } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { AuthContextService } from './auth-context.service';
import { SessionLockComponent } from '../../layout/components/session-lock/session-lock.component';

@Injectable({ providedIn: 'root' })
export class SessionManagerService {
  private authService = inject(AuthService);
  private authContext = inject(AuthContextService);
  private dialog = inject(MatDialog);
  private zone = inject(NgZone);

  private readonly REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
  
  private refreshSub?: Subscription;
  private inactivitySub?: Subscription;
  private lockDialogRef: MatDialogRef<SessionLockComponent> | null = null;

  public isLocked = signal(false);

  constructor() {
    // We don't start immediately; we wait for authentication
  }

  init() {
    this.authContext.isAuthenticated; // Watch authentication state
    
    // Use an effect-like pattern or just check regularly
    interval(1000).pipe(
      filter(() => this.authContext.isAuthenticated() && !this.isLocked())
    ).subscribe(() => {
      if (!this.refreshSub) this.startTimers();
    });

    // Handle logout
    interval(1000).pipe(
      filter(() => !this.authContext.isAuthenticated())
    ).subscribe(() => {
      this.stopTimers();
    });
  }

  private startTimers() {
    this.stopTimers();

    // 1. Auto-Refresh Timer
    this.refreshSub = interval(this.REFRESH_INTERVAL).pipe(
      switchMap(() => this.authService.refreshToken())
    ).subscribe();

    // 2. Inactivity Detection
    this.zone.runOutsideAngular(() => {
      const activity$ = merge(
        fromEvent(window, 'mousemove'),
        fromEvent(window, 'keydown'),
        fromEvent(window, 'click'),
        fromEvent(window, 'scroll')
      ).pipe(throttleTime(1000));

      this.inactivitySub = activity$.pipe(
        switchMap(() => interval(this.INACTIVITY_TIMEOUT).pipe(throttleTime(this.INACTIVITY_TIMEOUT)))
      ).subscribe(() => {
        this.zone.run(() => this.lockScreen());
      });
      
      // Initial inactivity timer
      this.inactivitySub = interval(this.INACTIVITY_TIMEOUT).subscribe(() => {
        this.zone.run(() => this.lockScreen());
      });
    });
  }

  private stopTimers() {
    this.refreshSub?.unsubscribe();
    this.inactivitySub?.unsubscribe();
    this.refreshSub = undefined;
    this.inactivitySub = undefined;
  }

  private lockScreen() {
    if (this.isLocked() || !this.authContext.isAuthenticated()) return;

    this.isLocked.set(true);
    this.stopTimers();

    this.lockDialogRef = this.dialog.open(SessionLockComponent, {
      disableClose: true,
      backdropClass: 'session-lock-backdrop',
      panelClass: 'session-lock-panel'
    });

    this.lockDialogRef.afterClosed().subscribe(unlocked => {
      if (unlocked) {
        this.isLocked.set(false);
        this.startTimers();
      } else {
        this.authService.logout();
      }
    });
  }
}

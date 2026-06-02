import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, catchError, switchMap, throwError, map, tap, finalize } from 'rxjs';
import {
  LoginRequest, RegisterRequest, RegisterCompanyRequest,
  LoginResponse, AuthDataService, Branch
} from '../../features/auth/services/data.service';
import { User } from '../models/user.model';
import { PermissionService } from './permission.service';
import { StorageService } from './storage.service';
import { AuthContextService } from './auth-context.service';
import { globalConstants } from '../constants/global.constants';
import { AppBootstrapService } from './app-bootstrap.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authDataService   = inject(AuthDataService);
  private readonly permissionService = inject(PermissionService);
  private readonly storageService    = inject(StorageService);
  private readonly authContext       = inject(AuthContextService);
  private readonly router            = inject(Router);
  private readonly appBootstrap      = inject(AppBootstrapService);

  public readonly isAuthenticated    = this.authContext.isAuthenticated;
  public readonly user               = this.authContext.user;
  public readonly availableBranches  = this.authContext.availableBranches;

  getUser() { return this.authContext.user; }

  // ─── Token accessors ─────────────────────────────────────────────────────

  getToken(): string | null {
    return this.storageService.getItem<string>(globalConstants.storageKeys.accessToken, 'session');
  }

  getRefreshToken(): string | null {
    return this.storageService.getItem<string>(globalConstants.storageKeys.refreshToken, 'session');
  }

  // ─── App bootstrap ────────────────────────────────────────────────────────

  initialize(): Observable<boolean | User | null> {
    const token = this.getToken();
    if (!token) {
      return of(null);
    }

    // If the access token is expired, try to refresh silently before restoring state
    if (this.authContext.isTokenExpired(token)) {
      return this.refreshToken().pipe(
        switchMap(() => {
          const loaded = this.authContext.loadFromStorage();
          if (loaded) {
            this.syncPermissions();
            return of(true as boolean | null);
          }
          return of(null as boolean | null);
        }),
        catchError(() => {
          this.logout();
          return of(null);
        })
      );
    }

    const loaded = this.authContext.loadFromStorage();
    if (loaded) {
      this.syncPermissions();
      return of(true);
    }

    // Token valid but cache cleared — fetch profile from server
    return this.loadProfile();
  }

  // ─── Auth actions ─────────────────────────────────────────────────────────

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.authDataService.login(credentials).pipe(
      tap((response: LoginResponse) => {
        this.setSession(response);
        this.rememberLastUsed(credentials.user_id, response.company_no, response.branch_no);
      })
    );
  }

  /**
   * Sends the stored refresh token to the server, receives a rotated pair,
   * and saves both the new access token and new refresh token to localStorage.
   * Returns the new access token string for the interceptor to use immediately.
   */
  refreshToken(): Observable<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token in storage'));
    }

    return this.authDataService.refresh({ refresh_token: refreshToken }).pipe(
      tap(response => {
        this.storageService.setItem(globalConstants.storageKeys.accessToken, response.access_token, 'session');
        if (response.refresh_token) {
          this.storageService.setItem(globalConstants.storageKeys.refreshToken, response.refresh_token, 'session');
        }
      }),
      map(response => response.access_token),
      catchError(err => throwError(() => err))
    );
  }

  logout(): void {
    this.authDataService.logout().pipe(
      catchError(() => of(void 0)),
      finalize(() => {
        this.storageService.removeItem(globalConstants.storageKeys.accessToken, 'session');
        this.storageService.removeItem(globalConstants.storageKeys.refreshToken, 'session');
        this.authContext.clear();
        this.permissionService.clearPermissions();
        this.appBootstrap.clear();          // wipe logo + currency cache
        this.router.navigate(['/auth/login']);
      })
    ).subscribe();
  }

  register(userData: RegisterRequest): Observable<unknown> {
    return this.authDataService.register(userData);
  }

  registerCompany(data: RegisterCompanyRequest): Observable<unknown> {
    return this.authDataService.registerCompany(data);
  }

  switchBranch(branchId: number): void {
    this.authDataService.switchBranch(branchId).subscribe((response) => {
      this.setSession(response);
    });
  }

  /** Switch the active company (multi-company users); re-issues the JWT for the target company. */
  switchCompany(companyNo: number, branchNo?: number): void {
    this.authDataService.switchCompany(companyNo, branchNo).subscribe((response) => {
      this.setSession(response);
    });
  }

  setAvailableBranches(branches: Branch[]): void {
    this.authContext.setAvailableBranches(branches);
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private setSession(response: LoginResponse): void {
    // Per re-plan §4.5: token + active context are per-tab (sessionStorage).
    this.storageService.setItem(globalConstants.storageKeys.accessToken,  response.access_token,  'session');
    this.storageService.setItem(globalConstants.storageKeys.refreshToken, response.refresh_token, 'session');

    const user: User = {
      user_no:       response.user_no,
      user_name:     response.user_name,
      name:          response.employee_name ?? response.user_name,
      employee_no:   response.employee_no,
      company_no:    response.company_no,
      company_name:  response.company_name,
      branch_no:     response.branch_no,
      branch_name:   response.branch_name,
      access_scope:  response.access_scope,
    };

    this.authContext.populateFromLogin(user, response.permissions ?? null, response.menu ?? []);
    this.authContext.setAvailableBranches(response.available_branches ?? []);

    if (response.permissions) {
      this.permissionService.setPermissions(response.permissions);
    } else {
      this.permissionService.clearPermissions();
    }

    // Fetch company logo + currency once per login/branch-switch; results are
    // cached in sessionStorage — no repeated API calls during the session.
    this.appBootstrap.bootstrap();
  }

  private loadProfile(): Observable<User> {
    return this.authDataService.getProfile().pipe(
      map(profile => {
        const user: User = {
          user_no:      profile.user_no,
          user_name:    profile.user_name,
          name:         profile.name ?? profile.user_name,
          designation:  profile.designation,
          company_no:   profile.company_no,
          company_name: profile.company_name,
          branch_no:    profile.branch_no,
          branch_name:  profile.branch_name,
        };
        this.authContext.populateFromLogin(user, null, []);
        return user;
      }),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  private syncPermissions(): void {
    const perms = this.authContext.permissions();
    if (perms) {
      this.permissionService.setPermissions(perms);
    }
  }

  /** Persist the last successful login context (localStorage) to pre-fill the login picker next time. */
  private rememberLastUsed(userId: string, companyNo?: number, branchNo?: number): void {
    if (userId)             this.storageService.setItem(globalConstants.storageKeys.lastUserId, userId, 'local');
    if (companyNo != null)  this.storageService.setItem(globalConstants.storageKeys.lastCompanyNo, companyNo, 'local');
    if (branchNo != null)   this.storageService.setItem(globalConstants.storageKeys.lastBranchNo, branchNo, 'local');
  }
}

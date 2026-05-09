import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, catchError, switchMap, throwError, map, tap } from 'rxjs';
import {
  LoginRequest, RegisterRequest, RegisterCompanyRequest,
  LoginResponse, AuthDataService, Branch
} from '../../features/auth/services/data.service';
import { User } from '../models/user.model';
import { PermissionService } from './permission.service';
import { StorageService } from './storage.service';
import { AuthContextService } from './auth-context.service';
import { globalConstants } from '../constants/global.constants';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authDataService  = inject(AuthDataService);
  private readonly permissionService = inject(PermissionService);
  private readonly storageService    = inject(StorageService);
  private readonly authContext       = inject(AuthContextService);
  private readonly router            = inject(Router);

  public readonly isAuthenticated    = this.authContext.isAuthenticated;
  public readonly user               = this.authContext.user;
  public readonly availableBranches  = this.authContext.availableBranches;

  getUser() { return this.authContext.user; }

  // ─── Token accessors ─────────────────────────────────────────────────────

  getToken(): string | null {
    return this.storageService.getItem<string>(globalConstants.storageKeys.accessToken);
  }

  getRefreshToken(): string | null {
    return this.storageService.getItem<string>(globalConstants.storageKeys.refreshToken);
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
      tap((response: LoginResponse) => this.setSession(response))
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
        this.storageService.setItem(globalConstants.storageKeys.accessToken, response.access_token);
        this.storageService.setItem(globalConstants.storageKeys.refreshToken, response.refresh_token);
      }),
      map(response => response.access_token),
      catchError(err => throwError(() => err))
    );
  }

  logout(): void {
    this.storageService.removeItem(globalConstants.storageKeys.accessToken);
    this.storageService.removeItem(globalConstants.storageKeys.refreshToken);
    this.authContext.clear();
    this.permissionService.clearPermissions();
    this.router.navigate(['/auth/login']);
  }

  register(userData: RegisterRequest): Observable<unknown> {
    return this.authDataService.register(userData);
  }

  registerCompany(data: RegisterCompanyRequest): Observable<unknown> {
    return this.authDataService.registerCompany(data);
  }

  switchBranch(branchId: number): void {
    this.authContext.updateUser({ branch_no: branchId });
  }

  setAvailableBranches(branches: Branch[]): void {
    this.authContext.setAvailableBranches(branches);
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private setSession(response: LoginResponse): void {
    this.storageService.setItem(globalConstants.storageKeys.accessToken,  response.access_token);
    this.storageService.setItem(globalConstants.storageKeys.refreshToken, response.refresh_token);

    const user: User = {
      user_no:       response.user_no,
      user_name:     response.user_name,
      name:          response.employee_name ?? response.user_name,
      employee_no:   response.employee_no,
      company_no:    response.company_no,
      company_name:  response.company_name,
      branch_no:     response.branch_no,
      branch_name:   response.branch_name,
    };

    this.authContext.populateFromLogin(user, response.permissions ?? null, response.menu ?? []);

    if (response.permissions) {
      this.permissionService.setPermissions(response.permissions);
    }
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
}

import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, of, catchError, switchMap, map } from 'rxjs';
import { LoginRequest, RegisterRequest, RegisterCompanyRequest, LoginResponse, AuthDataService, Branch } from '../../features/auth/services/data.service';
import { User } from '../models/user.model';
import { PermissionService } from './permission.service';
import { StorageService } from './storage.service';
import { AuthContextService } from './auth-context.service';
import { globalConstants } from '../constants/global.constants';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authDataService = inject(AuthDataService);
  private permissionService = inject(PermissionService);
  private storageService = inject(StorageService);
  private authContext = inject(AuthContextService);
  private router = inject(Router);

  // Expose authentication state as a signal
  public isAuthenticated = this.authContext.isAuthenticated;
  public user = this.authContext.user;
  public availableBranches = this.authContext.availableBranches;

  getUser() {
    return this.authContext.user;
  }

  initialize(): Observable<boolean | User | null> {
    const token = this.getToken();
    if (!token) {
      return of(null);
    }

    // Check if token is expired
    if (this.authContext.isTokenExpired(token)) {
      return this.refreshToken().pipe(
        switchMap(() => {
          const loaded = this.authContext.loadFromStorage();
          if (loaded) {
            this.syncPermissions();
            return of(true);
          }
          return of(null);
        }),
        catchError(() => {
          this.logout();
          return of(null);
        })
      );
    }

    // Try to load state from LocalStorage using AuthContextService
    const loaded = this.authContext.loadFromStorage();

    if (loaded) {
      this.syncPermissions();
      return of(true);
    }

    // Fallback: If cache missing but token exists (legacy or cleared), fetch profile
    return this.loadProfile();
  }

  private syncPermissions() {
    const perms = this.authContext.permissions();
    if (perms) {
      this.permissionService.setPermissions(perms);
    }
  }

  getToken(): string | null {
    return this.storageService.getItem<string>(globalConstants.storageKeys.accessToken);
  }

  getRefreshToken(): string | null {
    return this.storageService.getItem<string>(globalConstants.storageKeys.refreshToken);
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.authDataService.login(credentials).pipe(
      tap((response: LoginResponse) => {
        this.setSession(response);
      })
    );
  }

  refreshToken(): Observable<LoginResponse | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return of(null);
    }

    return this.authDataService.refresh({ refresh_token: refreshToken }).pipe(
      tap((response: LoginResponse) => {
        this.setSession(response);
      }),
      catchError(err => {
        this.logout();
        throw err;
      })
    );
  }

  register(userData: RegisterRequest): Observable<unknown> {
    return this.authDataService.register(userData);
  }

  registerCompany(data: RegisterCompanyRequest): Observable<unknown> {
    return this.authDataService.registerCompany(data);
  }

  switchBranch(branchId: number) {
    const user = this.authContext.user();
    if (user) {
      const updatedUser = { ...user, branch_no: branchId };
      this.authContext.user.set(updatedUser);
      this.authContext.encryptAndStore(globalConstants.storageKeys.userData, updatedUser);
    }
  }

  setAvailableBranches(branches: Branch[]) {
    this.authContext.setAvailableBranches(branches);
  }

  logout() {
    this.storageService.removeItem(globalConstants.storageKeys.accessToken);
    this.storageService.removeItem(globalConstants.storageKeys.refreshToken);
    this.authContext.clear();
    this.permissionService.clearPermissions();
    this.router.navigate(['/auth/login']);
  }

  private setSession(response: LoginResponse) {
    this.storageService.setItem(globalConstants.storageKeys.accessToken, response.access_token);
    this.storageService.setItem(globalConstants.storageKeys.refreshToken, response.refresh_token);
    
    // Only update context if user/permissions/menu are present (prevents clearing state on refresh)
    const user: User = {
      ...(response.user || {}),
      user_no: response.user?.user_no || response.user_no,
      user_name: response.user?.user_name || response.user_name,
      name: response.user?.name || response.user_name,
      company_no: response.user?.company_no || response.company_no,
      company_name: response.user?.company_name || response.company_name,
      branch_no: response.user?.branch_no || response.branch_no,
      branch_name: response.user?.branch_name || response.branch_name
    } as User;

    this.authContext.populateFromLogin(user, response.permissions || null, response.menu || []);
    
    if (response.permissions) {
      this.permissionService.setPermissions(response.permissions);
    }
  }

  private loadProfile(): Observable<User> {
    return this.authDataService.getProfile().pipe(
      tap(user => {
          this.authContext.user.set(user);
          this.authContext.encryptAndStore(globalConstants.storageKeys.userData, user);
      }),
      catchError((err) => {
        this.logout();
        throw err;
      })
    );
  }
}

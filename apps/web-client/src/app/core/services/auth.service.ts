import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, of, catchError } from 'rxjs';
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

    // Try to load state from LocalStorage using AuthContextService
    const loaded = this.authContext.loadFromStorage();

    if (loaded) {
        // Also sync with PermissionService
        const perms = this.authContext.permissions();
        if (perms) {
          this.permissionService.setPermissions(perms);
        }
        return of(true); 
    }

    // Fallback: If cache missing but token exists (legacy or cleared), fetch profile
    return this.loadProfile();
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
    const user = response.user || (response.user_no ? {
      user_no: response.user_no,
      name: response.user_name,
      company_no: response.company_no,
      branch_no: response.branch_no
    } : null);

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

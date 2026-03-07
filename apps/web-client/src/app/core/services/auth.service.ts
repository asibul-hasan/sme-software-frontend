import { Injectable, signal } from '@angular/core';
import { Observable, tap, of, catchError } from 'rxjs';
import { User, LoginRequest, LoginResponse, AuthDataService } from '../../features/auth/services/data.service';
import { PermissionService } from './permission.service';
import { IPermissionConfig } from '../models/permission.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private user = signal<User | null>(null);
  
  private readonly TOKEN_KEY = 'access_token';
  private readonly USER_KEY = 'user_data';
  private readonly PERM_KEY = 'user_permissions';

  constructor(
    private authDataService: AuthDataService,
    private permissionService: PermissionService
  ) {}

  initialize(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return of(null);
    }

    // Try to load state from LocalStorage first to avoid API calls on refresh
    const cachedUser = localStorage.getItem(this.USER_KEY);
    const cachedPerms = localStorage.getItem(this.PERM_KEY);

    if (cachedUser && cachedPerms) {
        try {
            this.user.set(JSON.parse(cachedUser));
            this.permissionService.setPermissions(JSON.parse(cachedPerms));
            // Optional: Verify token validity or refresh profile in background
            return of(true); 
        } catch (e) {
            console.error('Error parsing cached auth data', e);
            this.logout();
            return of(null);
        }
    }

    // Fallback: If cache missing but token exists (legacy or cleared), fetch profile
    return this.loadProfile();
  }

  getUser() {
    return this.user;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.authDataService.login(credentials).pipe(
      tap(response => {
        this.setSession(response);
      })
    );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.PERM_KEY);
    this.user.set(null);
    this.permissionService.clearPermissions();
  }

  private setSession(response: LoginResponse) {
    localStorage.setItem(this.TOKEN_KEY, response.access_token);
    
    // Store User
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    this.user.set(response.user);

    // Store Permissions
    localStorage.setItem(this.PERM_KEY, JSON.stringify(response.permissions));
    this.permissionService.setPermissions(response.permissions);
  }

  private loadProfile() {
    // If strict on login response, this might be redundant, but good as fallback
    return this.authDataService.getProfile().pipe(
      tap(user => {
          this.user.set(user);
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      }),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }
}

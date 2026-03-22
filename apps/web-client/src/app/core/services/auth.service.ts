import { Injectable, signal } from '@angular/core';
import { Observable, tap, of, catchError } from 'rxjs';
import { User, LoginRequest, RegisterRequest, RegisterCompanyRequest, LoginResponse, AuthDataService } from '../../features/auth/services/data.service';
import { PermissionService } from './permission.service';
import { IPermissionConfig } from '../models/permission.model';
import { StorageService } from './storage.service';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private user = signal<User | null>(null);
  
  private readonly TOKEN_KEY = 'access_token';
  private readonly USER_KEY = 'user_data';
  private readonly PERM_KEY = 'user_permissions';

  constructor(
    private authDataService: AuthDataService,
    private permissionService: PermissionService,
    private storageService: StorageService
  ) {}

  initialize(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return of(null);
    }

    // Try to load state from LocalStorage first to avoid API calls on refresh
    const cachedUser = this.storageService.getItem<User>(this.USER_KEY);
    const cachedPerms = this.storageService.getItem<any>(this.PERM_KEY);

    if (cachedUser && cachedPerms) {
        try {
            this.user.set(cachedUser);
            this.permissionService.setPermissions(cachedPerms);
            // Optional: Verify token validity or refresh profile in background
            return of(true); 
        } catch (e) {
            console.error('Error setting cached auth data', e);
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
    return this.storageService.getItem<string>(this.TOKEN_KEY);
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.authDataService.login(credentials).pipe(
      tap(response => {
        this.setSession(response);
      })
    );
  }

  register(userData: RegisterRequest): Observable<any> {
    return this.authDataService.register(userData);
  }

  registerCompany(data: RegisterCompanyRequest): Observable<any> {
    return this.authDataService.registerCompany(data);
  }

  logout() {
    this.storageService.removeItem(this.TOKEN_KEY);
    this.storageService.removeItem(this.USER_KEY);
    this.storageService.removeItem(this.PERM_KEY);
    this.user.set(null);
    this.permissionService.clearPermissions();
  }

  private setSession(response: LoginResponse) {
    this.storageService.setItem(this.TOKEN_KEY, response.access_token);
    
    // Store User
    this.storageService.setItem(this.USER_KEY, response.user);
    this.user.set(response.user);

    // Store Permissions
    this.storageService.setItem(this.PERM_KEY, response.permissions);
    this.permissionService.setPermissions(response.permissions);
  }

  private loadProfile() {
    // If strict on login response, this might be redundant, but good as fallback
    return this.authDataService.getProfile().pipe(
      tap(user => {
          this.user.set(user);
          this.storageService.setItem(this.USER_KEY, user);
      }),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }
}

import { Injectable } from '@angular/core';
import { Observable, tap, of, catchError } from 'rxjs';
import { User, LoginRequest, RegisterRequest, RegisterCompanyRequest, LoginResponse, AuthDataService } from '../../features/auth/services/data.service';
import { PermissionService } from './permission.service';
import { StorageService } from './storage.service';
import { AuthContextService } from './auth-context.service';
import { globalConstants } from '../constants/global.constants';

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(
    private authDataService: AuthDataService,
    private permissionService: PermissionService,
    private storageService: StorageService,
    private authContext: AuthContextService
  ) {}

  initialize(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return of(null);
    }

    // Try to load state from LocalStorage using AuthContextService
    const loaded = this.authContext.loadFromStorage();

    if (loaded) {
        // Also sync with PermissionService
        this.permissionService.setPermissions(this.authContext.permissions());
        return of(true); 
    }

    // Fallback: If cache missing but token exists (legacy or cleared), fetch profile
    return this.loadProfile();
  }

  getUser() {
    return this.authContext.user;
  }

  getToken(): string | null {
    return this.storageService.getItem<string>(globalConstants.storageKeys.accessToken);
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
    this.storageService.removeItem(globalConstants.storageKeys.accessToken);
    this.authContext.clear();
    this.permissionService.clearPermissions();
  }

  private setSession(response: LoginResponse) {
    this.storageService.setItem(globalConstants.storageKeys.accessToken, response.access_token);
    
    // Use AuthContextService to encrypt and store signals
    this.authContext.populateFromLogin(response.user, response.permissions, response.menu || []);
    
    // Set for backward compatibility in PermissionService
    this.permissionService.setPermissions(response.permissions);
  }

  private loadProfile() {
    return this.authDataService.getProfile().pipe(
      tap(user => {
          this.authContext.user.set(user);
          this.authContext.encryptAndStore(globalConstants.storageKeys.userData, user);
      }),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }
}

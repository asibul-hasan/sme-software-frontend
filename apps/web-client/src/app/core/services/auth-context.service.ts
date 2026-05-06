import { Injectable, signal, computed, inject } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { globalConstants } from '../constants/global.constants';
import { User } from '../models/user.model';
import { IPermissionConfig } from '../models/permission.model';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class AuthContextService {
  private helper = new JwtHelperService();
  private storageService = inject(StorageService);

  // Signals for state management
  user = signal<User | null>(null);
  permissions = signal<IPermissionConfig | null>(null);
  menu = signal<unknown[]>([]);
  availableBranches = signal<import('../../features/auth/services/data.service').Branch[]>([]);

  // Computed state
  isAuthenticated = computed(() => !!this.user());

  // Decode JWT token to get claims if needed
  decodeToken(token: string): unknown {
    try {
      return this.helper.decodeToken(token);
    } catch (e) {
      console.error('Error decoding token', e);
      return null;
    }
  }

  isTokenExpired(token: string): boolean {
    try {
      return this.helper.isTokenExpired(token);
    } catch (e) {
      return true;
    }
  }

  // Encrypt and store data
  encryptAndStore(key: string, data: unknown): void {
    this.storageService.setSecureItem(key, data);
  }

  // Retrieve and decrypt data
  decryptAndRetrieve<T>(key: string): T | null {
    return this.storageService.getSecureItem<T>(key);
  }

  // Populate state from login response
  populateFromLogin(userPayload: User | null, permissionsPayload: IPermissionConfig | null, menuPayload: unknown[]) {
    if (userPayload) {
      this.user.set(userPayload);
      this.encryptAndStore(globalConstants.storageKeys.userData, userPayload);
    }
    
    if (permissionsPayload) {
      this.permissions.set(permissionsPayload);
      this.encryptAndStore(globalConstants.storageKeys.userPermissions, permissionsPayload);
    }

    if (menuPayload && menuPayload.length > 0) {
      this.menu.set(menuPayload);
      this.encryptAndStore(globalConstants.storageKeys.userMenu, menuPayload);
    }
  }

  setAvailableBranches(branches: import('../../features/auth/services/data.service').Branch[]) {
    this.availableBranches.set(branches);
    this.encryptAndStore(globalConstants.storageKeys.availableBranches, branches);
  }

  // Load state from local storage on initialization
  loadFromStorage(): boolean {
    const cachedUser = this.decryptAndRetrieve<User>(globalConstants.storageKeys.userData);
    const cachedPerms = this.decryptAndRetrieve<IPermissionConfig>(globalConstants.storageKeys.userPermissions);
    const cachedMenu = this.decryptAndRetrieve<unknown[]>(globalConstants.storageKeys.userMenu);
    const cachedBranches = this.decryptAndRetrieve<any[]>(globalConstants.storageKeys.availableBranches);

    if (cachedUser) {
      this.user.set(cachedUser);
      this.permissions.set(cachedPerms || null);
      this.menu.set(cachedMenu || []);
      this.availableBranches.set(cachedBranches || []);
      return true;
    }
    return false;
  }

  clear() {
    this.user.set(null);
    this.permissions.set(null);
    this.menu.set([]);
    this.availableBranches.set([]);
    this.storageService.removeItem(globalConstants.storageKeys.userData);
    this.storageService.removeItem(globalConstants.storageKeys.userPermissions);
    this.storageService.removeItem(globalConstants.storageKeys.userMenu);
    this.storageService.removeItem(globalConstants.storageKeys.availableBranches);
  }
}

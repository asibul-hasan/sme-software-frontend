import { Injectable, signal, computed } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import * as CryptoJS from 'crypto-js';
import { globalConstants } from '../constants/global.constants';
import { User } from '../models/user.model';
import { IPermissionConfig } from '../models/permission.model';

@Injectable({ providedIn: 'root' })
export class AuthContextService {
  private helper = new JwtHelperService();

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
    try {
      const jsonStr = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonStr, globalConstants.encryption.secretKey).toString();
      localStorage.setItem(key, encrypted);
    } catch (e) {
      console.error('Encryption failed', e);
    }
  }

  // Retrieve and decrypt data
  decryptAndRetrieve<T>(key: string): T | null {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      const bytes = CryptoJS.AES.decrypt(encrypted, globalConstants.encryption.secretKey);
      const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedStr) as T;
    } catch (e) {
      console.error('Decryption failed', e);
      return null;
    }
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
    localStorage.removeItem(globalConstants.storageKeys.userData);
    localStorage.removeItem(globalConstants.storageKeys.userPermissions);
    localStorage.removeItem(globalConstants.storageKeys.userMenu);
    localStorage.removeItem(globalConstants.storageKeys.availableBranches);
  }
}

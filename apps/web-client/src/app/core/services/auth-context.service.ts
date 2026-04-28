import { Injectable, signal } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import * as CryptoJS from 'crypto-js';
import { globalConstants } from '../constants/global.constants';

@Injectable({ providedIn: 'root' })
export class AuthContextService {
  private helper = new JwtHelperService();

  // Signals for state management
  user = signal<any | null>(null);
  permissions = signal<any | null>(null);
  menu = signal<any[]>([]);

  constructor() {}

  // Decode JWT token to get claims if needed
  decodeToken(token: string): any {
    try {
      return this.helper.decodeToken(token);
    } catch (e) {
      console.error('Error decoding token', e);
      return null;
    }
  }

  // Encrypt and store data
  encryptAndStore(key: string, data: any): void {
    try {
      const jsonStr = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonStr, globalConstants.encryption.secretKey).toString();
      localStorage.setItem(key, encrypted);
    } catch (e) {
      console.error('Encryption failed', e);
    }
  }

  // Retrieve and decrypt data
  decryptAndRetrieve(key: string): any | null {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      const bytes = CryptoJS.AES.decrypt(encrypted, globalConstants.encryption.secretKey);
      const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedStr);
    } catch (e) {
      console.error('Decryption failed', e);
      return null;
    }
  }

  // Populate state from login response
  populateFromLogin(userPayload: any, permissionsPayload: any, menuPayload: any[]) {
    this.user.set(userPayload);
    this.permissions.set(permissionsPayload);
    this.menu.set(menuPayload || []);

    this.encryptAndStore(globalConstants.storageKeys.userData, userPayload);
    this.encryptAndStore(globalConstants.storageKeys.userPermissions, permissionsPayload);
    this.encryptAndStore(globalConstants.storageKeys.userMenu, menuPayload || []);
  }

  // Load state from local storage on initialization
  loadFromStorage(): boolean {
    const cachedUser = this.decryptAndRetrieve(globalConstants.storageKeys.userData);
    const cachedPerms = this.decryptAndRetrieve(globalConstants.storageKeys.userPermissions);
    const cachedMenu = this.decryptAndRetrieve(globalConstants.storageKeys.userMenu);

    if (cachedUser) {
      this.user.set(cachedUser);
      this.permissions.set(cachedPerms || null);
      this.menu.set(cachedMenu || []);
      return true;
    }
    return false;
  }

  clear() {
    this.user.set(null);
    this.permissions.set(null);
    this.menu.set([]);
    localStorage.removeItem(globalConstants.storageKeys.userData);
    localStorage.removeItem(globalConstants.storageKeys.userPermissions);
    localStorage.removeItem(globalConstants.storageKeys.userMenu);
  }
}

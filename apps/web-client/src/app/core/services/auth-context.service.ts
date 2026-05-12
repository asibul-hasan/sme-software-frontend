import { Injectable, computed, inject, signal } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { globalConstants } from '../constants/global.constants';
import { User } from '../models/user.model';
import { IPermissionConfig } from '../models/permission.model';
import { StorageService } from './storage.service';
import { Branch } from '../../features/auth/services/data.service';
import { AppGlobals } from '../app-globals';

/**
 * Application-wide reactive auth/tenant context.
 *
 * Owns: current user, permission map, flat menu list, and the list of
 * branches the user can switch into. Persisted to LocalStorage so a hard
 * reload doesn't kick the user back to the login screen while the access
 * token is still valid.
 */
@Injectable({ providedIn: 'root' })
export class AuthContextService {
  private readonly jwt     = new JwtHelperService();
  private readonly storage = inject(StorageService);

  readonly user              = signal<User | null>(null);
  readonly permissions       = signal<IPermissionConfig | null>(null);
  readonly menu              = signal<unknown[]>([]);
  readonly availableBranches = signal<Branch[]>([]);

  readonly isAuthenticated = computed(() => !!this.user());

  // ─── Token utilities ─────────────────────────────────────────────────────
  decodeToken(token: string): unknown {
    try {
      return this.jwt.decodeToken(token);
    } catch {
      return null;
    }
  }

  isTokenExpired(token: string): boolean {
    try {
      return this.jwt.isTokenExpired(token);
    } catch {
      return true;
    }
  }

  getTokenExpirationDate(token: string): Date | null {
    try {
      return this.jwt.getTokenExpirationDate(token);
    } catch {
      return null;
    }
  }

  // ─── State mutators ──────────────────────────────────────────────────────
  populateFromLogin(user: User | null, permissions: IPermissionConfig | null, menu: unknown[]): void {
    if (user) {
      this.user.set(user);
      AppGlobals.user = user;
      this.storage.setItem(globalConstants.storageKeys.userData, user);
    }
    this.permissions.set(permissions);
    if (permissions) {
      this.storage.setItem(globalConstants.storageKeys.userPermissions, permissions);
    } else {
      this.storage.removeItem(globalConstants.storageKeys.userPermissions);
    }

    this.menu.set(menu ?? []);
    this.storage.setItem(globalConstants.storageKeys.userMenu, menu ?? []);
  }

  setAvailableBranches(branches: Branch[]): void {
    this.availableBranches.set(branches);
    this.storage.setItem(globalConstants.storageKeys.availableBranches, branches);
  }

  /** Rehydrate state from storage on app boot. Returns true if a user was found. */
  loadFromStorage(): boolean {
    const cachedUser     = this.storage.getItem<User>(globalConstants.storageKeys.userData);
    const cachedPerms    = this.storage.getItem<IPermissionConfig>(globalConstants.storageKeys.userPermissions);
    const cachedMenu     = this.storage.getItem<unknown[]>(globalConstants.storageKeys.userMenu);
    const cachedBranches = this.storage.getItem<Branch[]>(globalConstants.storageKeys.availableBranches);

    if (!cachedUser) return false;

    this.user.set(cachedUser);
    AppGlobals.user = cachedUser;
    this.permissions.set(cachedPerms ?? null);
    this.menu.set(cachedMenu ?? []);
    this.availableBranches.set(cachedBranches ?? []);
    return true;
  }

  /** Persist a partial user update (e.g. branch switch) without losing other state. */
  updateUser(partial: Partial<User>): void {
    const current = this.user();
    if (!current) return;
    const next = { ...current, ...partial };
    this.user.set(next);
    AppGlobals.user = next;
    this.storage.setItem(globalConstants.storageKeys.userData, next);
  }

  clear(): void {
    this.user.set(null);
    AppGlobals.user = {} as User;
    this.permissions.set(null);
    this.menu.set([]);
    this.availableBranches.set([]);
    this.storage.removeItem(globalConstants.storageKeys.userData);
    this.storage.removeItem(globalConstants.storageKeys.userPermissions);
    this.storage.removeItem(globalConstants.storageKeys.userMenu);
    this.storage.removeItem(globalConstants.storageKeys.availableBranches);
  }
}

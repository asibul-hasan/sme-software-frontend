import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { User, PharmacyBranch } from '../models';
import { SysMenu } from '../models/menu.models';
import { ApiService } from '../services/api.service';
import { ApiResponse } from '../models/common.models';

const TOKEN_KEY = 'aidly_pms_token';
const USER_KEY = 'aidly_pms_user';
const ACTIVE_BRANCH_KEY = 'aidly_pms_active_branch';
const MENU_KEY = 'aidly_pms_menu';
const PERMISSIONS_KEY = 'aidly_pms_permissions';
const FULL_ACCESS_KEY = 'aidly_pms_is_full_access';

export interface LoginResponseData {
  token: string;
  user: User;
  branch: PharmacyBranch;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);

  // Initial session restoration from localStorage
  private readonly initialToken: string | null = localStorage.getItem(TOKEN_KEY);
  private readonly initialUser: User | null = (() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  private readonly initialBranch: PharmacyBranch | null = (() => {
    try {
      const stored = localStorage.getItem(ACTIVE_BRANCH_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  private readonly initialMenu: SysMenu[] = (() => {
    try {
      const stored = localStorage.getItem(MENU_KEY);
      if (stored) return JSON.parse(stored);
      return this.initialUser?.menu || [];
    } catch {
      return [];
    }
  })();

  private readonly initialPermissions: string[] = (() => {
    try {
      const stored = localStorage.getItem(PERMISSIONS_KEY);
      if (stored) return JSON.parse(stored);
      return (this.initialUser?.permissions as string[]) || [];
    } catch {
      return [];
    }
  })();

  private readonly initialFullAccess: boolean = (() => {
    try {
      const stored = localStorage.getItem(FULL_ACCESS_KEY);
      if (stored !== null) return JSON.parse(stored);
      return !!this.initialUser?.is_full_access;
    } catch {
      return false;
    }
  })();

  readonly currentUser = signal<User | null>(this.initialUser);
  readonly activeBranch = signal<PharmacyBranch | null>(this.initialBranch);
  readonly token = signal<string | null>(this.initialToken);

  readonly menu = signal<SysMenu[]>(this.initialMenu);
  readonly permissions = signal<string[]>(this.initialPermissions);
  readonly isFullAccess = signal<boolean>(this.initialFullAccess);

  readonly isAuthenticated = computed(() => !!this.token() && !!this.currentUser());

  readonly isManager = computed(() => this.isFullAccess());

  constructor() {
    if (this.isAuthenticated()) {
      this.refreshUserAccess().subscribe({
        error: (err) => console.warn('Initial access refresh error:', err),
      });
    }

    if (typeof window !== 'undefined') {
      setInterval(() => {
        if (this.isAuthenticated()) {
          this.refreshUserAccess().subscribe({
            error: (err) => console.warn('Periodic access refresh error:', err),
          });
        }
      }, 5 * 60 * 1000);
    }
  }

  hasPermission(permissionCode: string): boolean {
    if (!permissionCode) return true;
    if (this.isFullAccess()) return true;
    return this.permissions().includes(permissionCode);
  }

  hasMenuAccess(menuCode: string, action: 'view' | 'create' | 'edit' | 'delete' = 'view'): boolean {
    if (!menuCode) return true;
    if (this.isFullAccess()) return true;

    const findInTree = (nodes: SysMenu[]): SysMenu | null => {
      for (const node of nodes) {
        if (node.menu_code === menuCode) return node;
        if (node.children?.length) {
          const found = findInTree(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    const target = findInTree(this.menu());
    if (!target) return false;

    if (!target.permissions) {
      return action === 'view';
    }

    return !!target.permissions[action];
  }

  firstAllowedRoute(): string {
    if (this.hasMenuAccess('DASH_2301', 'view')) {
      return '/dashboard';
    }

    const findFirstScreenRoute = (nodes: SysMenu[]): string | null => {
      for (const node of nodes) {
        if (node.menu_type === 'SCREEN' && (node.route || node.path)) {
          if (this.hasMenuAccess(node.menu_code, 'view')) {
            return node.route || node.path || null;
          }
        }
        if (node.children?.length) {
          const res = findFirstScreenRoute(node.children);
          if (res) return res;
        }
      }
      return null;
    };

    return findFirstScreenRoute(this.menu()) || '/dashboard';
  }

  canViewCostPrice(): boolean {
    if (this.isFullAccess()) return true;
    return this.hasMenuAccess('PUR_1503', 'view') || this.hasMenuAccess('DASH_2302', 'view');
  }

  refreshUserAccess(): Observable<ApiResponse<User>> {
    return this.apiService.get<User>('auth/me').pipe(
      tap((res) => {
        if (res.data) {
          const user = res.data;
          this.currentUser.set(user);

          const menu = user.menu || [];
          const perms = (user.permissions as string[]) || [];
          const fullAccess = !!user.is_full_access;

          this.menu.set(menu);
          this.permissions.set(perms);
          this.isFullAccess.set(fullAccess);

          localStorage.setItem(USER_KEY, JSON.stringify(user));
          localStorage.setItem(MENU_KEY, JSON.stringify(menu));
          localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(perms));
          localStorage.setItem(FULL_ACCESS_KEY, JSON.stringify(fullAccess));
        }
      })
    );
  }

  login(phone: string, password: string): Observable<ApiResponse<LoginResponseData>> {
    return this.apiService.post<LoginResponseData>('auth/login', { phone, password }).pipe(
      tap((res) => {
        if (res.data) {
          this.setSession(res.data.token, res.data.user, res.data.branch);
        }
      })
    );
  }

  switchBranch(branch: PharmacyBranch, token?: string): void {
    this.activeBranch.set(branch);
    localStorage.setItem(ACTIVE_BRANCH_KEY, JSON.stringify(branch));
    if (token) {
      this.token.set(token);
      localStorage.setItem(TOKEN_KEY, token);
    }
    this.refreshUserAccess().subscribe({
      error: (err) => console.warn('Access refresh on branch switch error:', err),
    });
  }

  setSession(token: string, user: User, branch: PharmacyBranch): void {
    this.token.set(token);
    this.currentUser.set(user);
    this.activeBranch.set(branch);

    const menu = user.menu || [];
    const perms = (user.permissions as string[]) || [];
    const fullAccess = !!user.is_full_access;

    this.menu.set(menu);
    this.permissions.set(perms);
    this.isFullAccess.set(fullAccess);

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(ACTIVE_BRANCH_KEY, JSON.stringify(branch));
    localStorage.setItem(MENU_KEY, JSON.stringify(menu));
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(perms));
    localStorage.setItem(FULL_ACCESS_KEY, JSON.stringify(fullAccess));
  }

  logout(): void {
    this.token.set(null);
    this.currentUser.set(null);
    this.activeBranch.set(null);
    this.menu.set([]);
    this.permissions.set([]);
    this.isFullAccess.set(false);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ACTIVE_BRANCH_KEY);
    localStorage.removeItem(MENU_KEY);
    localStorage.removeItem(PERMISSIONS_KEY);
    localStorage.removeItem(FULL_ACCESS_KEY);
    this.router.navigate(['/auth/login']);
  }
}

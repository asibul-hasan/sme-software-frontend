import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { User, PharmacyBranch } from '../models';
import { ApiService } from '../services/api.service';
import { ApiResponse } from '../models/common.models';

const TOKEN_KEY = 'aidly_pms_token';
const USER_KEY = 'aidly_pms_user';
const ACTIVE_BRANCH_KEY = 'aidly_pms_active_branch';

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

  readonly currentUser = signal<User | null>(this.initialUser);
  readonly activeBranch = signal<PharmacyBranch | null>(this.initialBranch);
  readonly token = signal<string | null>(this.initialToken);

  readonly isAuthenticated = computed(() => !!this.token() && !!this.currentUser());

  readonly isManager = computed(() => {
    const user = this.currentUser();
    if (!user) return false;
    return user.role_no !== 10;
  });

  hasPermission(permissionCode: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (!permissionCode) return true;
    if (user.role_no === 9 || user.role_no === 1) return true;
    return user.permissions?.includes(permissionCode) ?? false;
  }

  canViewCostPrice(): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (user.role_no === 10) return false; // Cashier blocked from cost prices
    return this.hasPermission('PMS-Vendor-Module') || this.hasPermission('PMS-Report-Module') || user.role_no === 9 || user.role_no === 1;
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
  }

  setSession(token: string, user: User, branch: PharmacyBranch): void {
    this.token.set(token);
    this.currentUser.set(user);
    this.activeBranch.set(branch);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(ACTIVE_BRANCH_KEY, JSON.stringify(branch));
  }

  logout(): void {
    this.token.set(null);
    this.currentUser.set(null);
    this.activeBranch.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ACTIVE_BRANCH_KEY);
    this.router.navigate(['/auth/login']);
  }
}

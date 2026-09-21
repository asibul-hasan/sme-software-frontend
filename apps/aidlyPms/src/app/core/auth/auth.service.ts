import { Injectable, computed, signal } from '@angular/core';
import { User, PharmacyBranch } from '../models';

const TOKEN_KEY = 'aidly_pms_token';
const ACTIVE_BRANCH_KEY = 'aidly_pms_active_branch';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Mock default demo session matching the Cumilla branch from React reference
  private readonly defaultBranch: PharmacyBranch = {
    pharmacy_no: 1,
    branch_no: 1,
    uuid: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Kazi — Cumilla',
    drug_license_no: 'DL-2024-CUM-8841',
    contact_phone: '+8801700000000',
    contact_email: 'cumilla@aidlypms.com',
    address: 'Station Road, Kandirpar, Cumilla',
    district: 'Cumilla',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  private readonly defaultUser: User = {
    user_no: 1,
    uuid: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
    pharmacy_no: 1,
    branch_no: 1,
    role_no: 1,
    first_name: 'Admin',
    last_name: 'Manager',
    phone: '+8801811111111',
    email: 'admin@aidlypms.com',
    password_hash: '$2a$12$e8m4DemoHashedPasswordTokenAidlyPmsEnterprise',
    gender: 1, // Male
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    permissions: [
      'PMS-Report-Module',
      'PMS-Product-Module',
      'POS-Shop-Company-Module',
      'POS-Shop-Generic-Module',
      'PMS-Requisition-Module',
      'PMS-Vendor-Module',
      'PMS-Sale-Module',
      'PMS-Customer-Module',
      'PMS-Reconciliation-Module',
      'PMS-Chart-Of-Accounting-Module',
      'PMS-Expense-Module',
      'PMS-Income-Module',
      'Account-Module',
      'Pharmacy-Module',
      'Role-Module',
    ],
  };

  readonly currentUser = signal<User | null>(this.defaultUser);
  readonly activeBranch = signal<PharmacyBranch | null>(this.defaultBranch);
  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY) || 'demo-jwt-token');

  readonly isAuthenticated = computed(() => !!this.currentUser());

  hasPermission(permissionCode: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (!permissionCode) return true;
    return user.permissions?.includes(permissionCode) ?? false;
  }

  switchBranch(branch: PharmacyBranch): void {
    this.activeBranch.set(branch);
    localStorage.setItem(ACTIVE_BRANCH_KEY, JSON.stringify(branch));
  }

  setSession(token: string, user: User, branch: PharmacyBranch): void {
    this.token.set(token);
    this.currentUser.set(user);
    this.activeBranch.set(branch);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ACTIVE_BRANCH_KEY, JSON.stringify(branch));
  }

  logout(): void {
    this.token.set(null);
    this.currentUser.set(null);
    this.activeBranch.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ACTIVE_BRANCH_KEY);
  }
}

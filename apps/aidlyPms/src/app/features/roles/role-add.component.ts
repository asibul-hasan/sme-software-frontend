import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { RoleService } from '../../core/services/role.service';

const MODULES = [
  'Account-Module',
  'Global-Account-Module',
  'PMS-Barcode-Module',
  'PMS-Chart-Of-Accounting-Module',
  'PMS-Customer-Module',
  'PMS-Expense-Category-Module',
  'PMS-Expense-Module',
  'PMS-Income-Category-Module',
  'PMS-Income-Module',
  'PMS-Product-Module',
  'PMS-Reconciliation-Module',
  'PMS-Report-Module',
  'PMS-Requisition-Module',
  'PMS-Sale-Module',
  'PMS-Vendor-Module',
  'POS-Shop-Company-Module',
  'POS-Shop-Generic-Module',
  'Permission-Module',
  'Pharmacy-Module',
  'Role-Module',
];

const OPS = ['VIEW', 'CREATE', 'UPDATE', 'DELETE'];

@Component({
  selector: 'app-role-add',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="max-w-3xl space-y-4">
      <app-page-header
        title="Create Role & Permissions"
        subtitle="Define new custom RBAC role with granular per-module operation rights"
        formId="ROLE_1902"
        [breadcrumbs]="[{ label: 'Roles', url: '/roles' }, { label: 'Create Role' }]"
      >
        <div actions class="flex items-center gap-2">
          <button nz-button nzType="default" (click)="goBack()" class="rounded-md">
            <span nz-icon nzType="arrow-left"></span> Back
          </button>
        </div>
      </app-page-header>

      <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <form (ngSubmit)="submitRole()" class="space-y-5">
          <div>
            <label for="role-add-role-alias-1" class="block text-xs font-semibold text-slate-700 mb-1">
              Role Alias <span class="text-rose-500">*</span>
            </label>
            <input id="role-add-role-alias-1"
              type="text"
              nz-input
              placeholder="e.g. Senior Pharmacist, Inventory Auditor"
              [(ngModel)]="roleAlias"
              name="roleAlias"
              class="rounded-md max-w-sm"
              required aria-label="Role Alias" />
          </div>

          <div class="border-t border-slate-100 pt-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold text-slate-800 text-sm">Permissions Matrix</h3>
              <div class="flex gap-2">
                <button
                  type="button"
                  (click)="grantAll()"
                  class="px-2.5 py-1 text-xs theme-btn-soft rounded border-0 cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  (click)="revokeAll()"
                  class="px-2.5 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded border-0 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div class="space-y-2">
              @for (mod of modules; track mod) {
                <div class="border border-slate-200 rounded-lg overflow-hidden">
                  <div
                    class="flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors"
                    [ngClass]="hasAnyPermission(mod) ? 'theme-active-row' : 'bg-slate-50'"
                    (click)="toggleGroup(mod)"
                  >
                    <div class="flex items-center gap-2">
                      <span
                        class="w-2 h-2 rounded-full"
                        [ngClass]="hasAllPermission(mod) ? 'theme-indicator-active' : hasAnyPermission(mod) ? 'bg-amber-400' : 'bg-slate-300'"
                      ></span>
                      <span class="text-xs font-semibold text-slate-700 font-mono">{{ mod }}</span>
                    </div>

                    <div class="flex items-center gap-3">
                      <button
                        type="button"
                        (click)="$event.stopPropagation(); toggleModuleAll(mod)"
                        class="text-xs theme-link border-0 bg-transparent cursor-pointer font-medium"
                      >
                        {{ hasAllPermission(mod) ? 'None' : 'All' }}
                      </button>
                      <span class="text-xs text-slate-400">
                        {{ openGroups[mod] ? '▲' : '▼' }}
                      </span>
                    </div>
                  </div>

                  @if (openGroups[mod]) {
                    <div class="px-4 py-2.5 bg-white grid grid-cols-4 gap-3 border-t border-slate-100">
                      @for (op of ops; track op) {
                        <label class="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                          <input
                            type="checkbox"
                            [checked]="perms[mod][op]"
                            (change)="toggleOp(mod, op)"
                            class="theme-checkbox rounded"
                          />
                          <span>{{ op }}</span>
                        </label>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" nz-button nzType="default" (click)="goBack()" class="rounded-md">
              Cancel
            </button>
            <button type="submit" nz-button nzType="primary" class="rounded-md">
              <span nz-icon nzType="check"></span> Submit Role
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class RoleAddComponent {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly msg = inject(NzMessageService);
  private readonly roleService = inject(RoleService);

  modules = MODULES;
  ops = OPS;

  roleAlias = '';
  perms: Record<string, Record<string, boolean>> = {};
  openGroups: Record<string, boolean> = {};

  constructor() {
    const p: Record<string, Record<string, boolean>> = {};
    for (const m of MODULES) {
      p[m] = { VIEW: false, CREATE: false, UPDATE: false, DELETE: false };
    }
    this.perms = p;
  }

  toggleGroup(mod: string): void {
    this.openGroups[mod] = !this.openGroups[mod];
  }

  toggleOp(mod: string, op: string): void {
    this.perms[mod][op] = !this.perms[mod][op];
  }

  toggleModuleAll(mod: string): void {
    const all = this.hasAllPermission(mod);
    for (const op of OPS) {
      this.perms[mod][op] = !all;
    }
  }

  hasAllPermission(mod: string): boolean {
    return OPS.every(op => this.perms[mod]?.[op]);
  }

  hasAnyPermission(mod: string): boolean {
    return OPS.some(op => this.perms[mod]?.[op]);
  }

  grantAll(): void {
    for (const m of MODULES) {
      for (const op of OPS) {
        this.perms[m][op] = true;
      }
    }
  }

  revokeAll(): void {
    for (const m of MODULES) {
      for (const op of OPS) {
        this.perms[m][op] = false;
      }
    }
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/roles']);
    }
  }

  submitRole(): void {
    if (!this.roleAlias.trim()) {
      this.msg.error('Please enter a role alias');
      return;
    }

    const selectedCodes: string[] = [];
    for (const m of MODULES) {
      for (const op of OPS) {
        if (this.perms[m]?.[op]) {
          selectedCodes.push(`${m.toUpperCase().replace(/-/g, '_')}_${op}`);
        }
      }
    }

    this.roleService.createRole({
      alias: this.roleAlias.trim(),
      is_system: false,
      permissions: selectedCodes,
    }).subscribe({
      next: (res) => {
        this.msg.success(res.message || `Role "${this.roleAlias}" created successfully!`);
        this.router.navigate(['/roles']);
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to create role');
      },
    });
  }
}

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalService } from '../../core/services/modal.service';
import { RoleService, SysRole } from '../../core/services/role.service';

interface RoleRow {
  id: number;
  alias: string;
  isSystem: boolean;
  permsCount: number;
  permissions?: string[];
}

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
  selector: 'app-role-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzIconModule,
    NzCheckboxModule,
    NzTagModule,
    NzTooltipModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Roles & Role-Based Access Control (RBAC)"
        subtitle="Configure system permissions, module accessibility, and operator authority"
        formId="ROLE_1901"
        [breadcrumbs]="[{ label: 'System', url: '/dashboard' }, { label: 'Roles' }]"
      >
        <div filters class="flex items-center gap-2 shrink-0 flex-wrap">
          <nz-input-group [nzPrefix]="searchIcon" class="w-64 shrink-0 rounded-md">
            <input id="role-list-search-roles-2"
              type="text"
              nz-input
              placeholder="Search roles..."
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)" aria-label="Search roles..." />
          </nz-input-group>
          <ng-template #searchIcon>
            <span nz-icon nzType="search" class="text-slate-400"></span>
          </ng-template>
          <button nz-button nzType="default" class="rounded-md h-7 px-2.5 text-xs shrink-0" (click)="searchQuery.set('')">
            <span nz-icon nzType="clear"></span> Reset
          </button>
        </div>
        <div actions class="flex items-center gap-2 shrink-0 flex-wrap">
          <a nz-button nzType="default" routerLink="/menus" class="rounded-md">
            <span nz-icon nzType="menu"></span> Menus
          </a>
          <a nz-button nzType="default" routerLink="/roles/permissions" class="rounded-md">
            <span nz-icon nzType="key"></span> Menu Permissions
          </a>
          <a nz-button nzType="default" routerLink="/roles/add" class="rounded-md">
            <span nz-icon nzType="plus"></span> Role Form
          </a>
          <button nz-button nzType="primary" class="rounded-md" (click)="openAddModal()">
            <span nz-icon nzType="plus"></span> Add Role (F2)
          </button>
        </div>
      </app-page-header>

      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <!-- Table Scroll Area -->
        <div class="flex-1 min-h-0 overflow-auto w-full max-w-full">
          <table class="w-full text-sm text-left border-collapse min-w-[600px]">
            <thead class="sticky top-0 z-10 bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200 shadow-xs">
              <tr>
                <th class="p-3 w-16 text-center">ID</th>
                <th class="p-3">Role Alias</th>
                <th class="p-3 text-center">Permissions</th>
                <th class="p-3 text-center w-40">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              @for (r of filteredRoles(); track r.id) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="p-3 text-center font-mono text-xs text-slate-400">#{{ r.id }}</td>
                  <td class="p-3 font-semibold text-slate-900">
                    {{ r.alias }}
                    @if (r.isSystem) {
                      <nz-tag nzColor="blue" class="text-[10px] ml-2 font-mono">System</nz-tag>
                    }
                  </td>
                  <td class="p-3 text-center">
                    <nz-tag nzColor="cyan" class="font-mono text-xs font-semibold">
                      {{ r.permsCount }} permissions enabled
                    </nz-tag>
                  </td>
                  <td class="p-3 text-center">
                    <div class="inline-flex items-center gap-1.5 justify-center">
                      <a
                        [routerLink]="['/roles/permissions']"
                        [queryParams]="{ roleNo: r.id }"
                        nz-tooltip
                        nzTooltipTitle="Configure Menu Permissions"
                        class="btn-tbl-action btn-tbl-neutral text-emerald-600 hover:text-emerald-700"
                       aria-label="Configure Menu Permissions">
                        <span nz-icon nzType="safety-certificate"></span>
                      </a>
                      <button
                        type="button"
                        (click)="openEditModal(r)"
                        nz-tooltip
                        nzTooltipTitle="Edit Role"
                        class="btn-tbl-action btn-tbl-edit"
                       aria-label="Edit Role">
                        <span nz-icon nzType="edit"></span>
                      </button>
                      <button
                        type="button"
                        (click)="cloneRole(r)"
                        nz-tooltip
                        nzTooltipTitle="Clone Role"
                        class="btn-tbl-action btn-tbl-neutral"
                       aria-label="Clone Role">
                        <span nz-icon nzType="copy"></span>
                      </button>
                      @if (!r.isSystem) {
                        <button
                          type="button"
                          (click)="deleteRole(r)"
                          nz-tooltip
                          nzTooltipTitle="Delete Role"
                          class="btn-tbl-action btn-tbl-delete"
                         aria-label="Delete Role">
                          <span nz-icon nzType="delete"></span>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="p-8 text-center text-slate-400 text-xs">
                    No roles match your search query.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Sticky Bottom Footer -->
        <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div class="flex items-center gap-3">
            <span>Configured Roles: <strong class="text-slate-900 font-semibold font-mono">{{ filteredRoles().length }}</strong></span>
          </div>
          <span class="text-slate-400 font-mono text-[11px]">Granular User Permission Control</span>
        </div>
      </div>
    </div>

    <!-- Quick Add/Edit Role Modal -->
    <nz-modal
      [(nzVisible)]="isModalOpen"
      [nzTitle]="modalMode === 'create' ? 'Add Role' : 'Edit Role'"
      [nzOkText]="modalMode === 'create' ? 'Create Role' : 'Save Changes'"
      (nzOnCancel)="isModalOpen = false"
      (nzOnOk)="saveRole()"
      nzWidth="680px"
    >
      <ng-container *nzModalContent>
        <div class="space-y-4 py-1">
          <div>
            <label for="role-list-role-alias-name-1" class="block text-xs font-semibold text-slate-700 mb-1">
              Role Alias / Name <span class="text-rose-500">*</span>
            </label>
            <input id="role-list-role-alias-name-1"
              type="text"
              nz-input
              placeholder="e.g. Lead Pharmacist, Billing Associate"
              [(ngModel)]="roleAlias"
              class="rounded-md" aria-label="Role Alias / Name" />
          </div>

          <div class="border-t border-slate-100 pt-3">
            <div class="flex items-center justify-between mb-2">
              <span class="font-semibold text-slate-800 text-xs">Permissions Matrix</span>
              <div class="flex gap-2">
                <button
                  type="button"
                  (click)="grantAll()"
                  class="px-2 py-0.5 text-xs theme-btn-soft rounded border-0 cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  (click)="revokeAll()"
                  class="px-2 py-0.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded border-0 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div class="space-y-1.5 max-h-72 overflow-auto pr-1">
              @for (mod of modules; track mod) {
                <div class="border border-slate-200 rounded-md overflow-hidden text-xs">
                  <div
                    class="flex items-center justify-between px-3 py-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
                    (click)="toggleGroup(mod)"
                  >
                    <div class="flex items-center gap-2">
                      <span
                        class="w-2 h-2 rounded-full"
                        [ngClass]="hasAllPermission(mod) ? 'theme-indicator-active' : hasAnyPermission(mod) ? 'bg-amber-400' : 'bg-slate-300'"
                      ></span>
                      <span class="font-medium text-slate-700 font-mono">{{ mod }}</span>
                    </div>

                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        (click)="$event.stopPropagation(); toggleModuleAll(mod)"
                        class="text-[11px] theme-link border-0 bg-transparent cursor-pointer font-medium"
                      >
                        {{ hasAllPermission(mod) ? 'None' : 'All' }}
                      </button>
                      <span class="text-slate-400 text-[10px]">
                        {{ openGroups[mod] ? '▲' : '▼' }}
                      </span>
                    </div>
                  </div>

                  @if (openGroups[mod]) {
                    <div class="px-3 py-2 bg-white grid grid-cols-4 gap-2 border-t border-slate-100">
                      @for (op of ops; track op) {
                        <label class="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600">
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
        </div>
      </ng-container>
    </nz-modal>
  `,
})
export class RoleListComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly roleService = inject(RoleService);

  modules = MODULES;
  ops = OPS;

  roles = signal<RoleRow[]>([]);
  searchQuery = signal('');

  filteredRoles = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.roles();
    return this.roles().filter(r => r.alias.toLowerCase().includes(q));
  });

  isModalOpen = false;
  modalMode: 'create' | 'edit' = 'create';
  selectedRoleId = 0;
  roleAlias = '';

  perms: Record<string, Record<string, boolean>> = {};
  openGroups: Record<string, boolean> = {};

  constructor() {
    this.initPerms();
  }

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (res) => {
        if (res.data) {
          const rows: RoleRow[] = res.data.map(r => ({
            id: r.role_no,
            alias: r.alias,
            isSystem: r.is_system,
            permsCount: r.permissions?.length || 0,
            permissions: r.permissions,
          }));
          this.roles.set(rows);
        }
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to load roles');
      },
    });
  }

  private initPerms(): void {
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

  openAddModal(): void {
    this.modalMode = 'create';
    this.selectedRoleId = 0;
    this.roleAlias = '';
    this.initPerms();
    this.openGroups = {};
    this.isModalOpen = true;
  }

  openEditModal(r: RoleRow): void {
    this.modalMode = 'edit';
    this.selectedRoleId = r.id;
    this.roleAlias = r.alias;
    this.initPerms();
    if (r.permissions && r.permissions.length > 0) {
      for (const pCode of r.permissions) {
        const parts = pCode.split('_');
        const op = parts[parts.length - 1];
        for (const m of MODULES) {
          const prefix = m.toUpperCase().replace(/-/g, '_');
          if (pCode.startsWith(prefix) && this.perms[m]) {
            this.perms[m][op] = true;
          }
        }
      }
    }
    this.isModalOpen = true;
  }

  saveRole(): void {
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

    if (this.modalMode === 'create') {
      this.roleService.createRole({
        alias: this.roleAlias.trim(),
        is_system: false,
        permissions: selectedCodes,
      }).subscribe({
        next: (res) => {
          this.msg.success(res.message || `Role "${this.roleAlias}" created successfully!`);
          this.isModalOpen = false;
          this.loadRoles();
        },
        error: (err) => {
          this.msg.error(err?.error?.message || 'Failed to create role');
        },
      });
    } else {
      this.roleService.updateRole(this.selectedRoleId, {
        alias: this.roleAlias.trim(),
        permissions: selectedCodes,
      }).subscribe({
        next: (res) => {
          this.msg.success(res.message || `Role "${this.roleAlias}" updated!`);
          this.isModalOpen = false;
          this.loadRoles();
        },
        error: (err) => {
          this.msg.error(err?.error?.message || 'Failed to update role');
        },
      });
    }
  }

  deleteRole(r: RoleRow): void {
    this.modal.confirmDelete(`Role "${r.alias}"`, 'This will delete the role definition.').subscribe(ok => {
      if (ok) {
        this.roleService.deleteRole(r.id).subscribe({
          next: () => {
            this.msg.success(`Role "${r.alias}" removed.`);
            this.loadRoles();
          },
          error: (err) => {
            this.msg.error(err?.error?.message || 'Failed to delete role');
          },
        });
      }
    });
  }

  cloneRole(r: RoleRow): void {
    this.roleService.createRole({
      alias: r.alias + ' (Clone)',
      is_system: false,
      permissions: r.permissions || [],
    }).subscribe({
      next: (res) => {
        this.msg.success(res.message || `Role "${r.alias}" cloned successfully!`);
        this.loadRoles();
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to clone role');
      },
    });
  }
}

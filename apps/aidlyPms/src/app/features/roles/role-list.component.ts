import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalService } from '../../core/services/modal.service';
import { RoleService, SysRole } from '../../core/services/role.service';
import { SPECIAL_PERMISSION_OPTIONS, SpecialPermissionOption } from '../../shared/constants/label-values.constant';

interface RoleRow {
  id: number;
  alias: string;
  description?: string;
  isSystem: boolean;
  status: boolean;
  permsCount: number;
  permissions?: string[];
}

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzDrawerModule,
    NzModalModule,
    NzIconModule,
    NzCheckboxModule,
    NzSwitchModule,
    NzTagModule,
    NzTooltipModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Roles & Role-Based Access Control (RBAC)"
        subtitle="Configure system roles, special privileges, and granular menu permissions"
        formId="ROLE_1901"
        [breadcrumbs]="[{ label: 'System', url: '/dashboard' }, { label: 'Roles' }]"
      >
        <div filters class="flex items-center gap-2 shrink-0 flex-wrap">
          <nz-input-group [nzPrefix]="searchIcon" class="w-64 shrink-0 rounded-md">
            <input
              id="role-list-search-roles-2"
              type="text"
              nz-input
              placeholder="Search roles..."
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              aria-label="Search roles..."
            />
          </nz-input-group>
          <ng-template #searchIcon>
            <span nz-icon nzType="search" class="text-slate-400"></span>
          </ng-template>
          <button
            nz-button
            nzType="default"
            class="rounded-md h-7 px-2.5 text-xs shrink-0"
            (click)="searchQuery.set('')"
          >
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
          <button nz-button nzType="primary" class="rounded-md" (click)="openCreateDrawer()">
            <span nz-icon nzType="plus"></span> Add Role
          </button>
        </div>
      </app-page-header>

      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <!-- Table Scroll Area -->
        <div class="flex-1 min-h-0 overflow-auto w-full max-w-full">
          <table class="w-full text-sm text-left border-collapse min-w-[650px]">
            <thead class="sticky top-0 z-10 bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200 shadow-xs">
              <tr>
                <th class="p-3 w-16 text-center">ID</th>
                <th class="p-3">Role Name</th>
                <th class="p-3">Description</th>
                <th class="p-3 text-center">Special Privileges</th>
                <th class="p-3 text-center w-24">Status</th>
                <th class="p-3 text-center w-44">Action</th>
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
                  <td class="p-3 text-xs text-slate-500 max-w-xs truncate">
                    {{ r.description || '—' }}
                  </td>
                  <td class="p-3 text-center">
                    <nz-tag nzColor="cyan" class="font-mono text-xs font-semibold">
                      {{ r.permsCount }} granted
                    </nz-tag>
                  </td>
                  <td class="p-3 text-center">
                    @if (r.status) {
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    } @else {
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                        Inactive
                      </span>
                    }
                  </td>
                  <td class="p-3 text-center">
                    <div class="inline-flex items-center gap-1.5 justify-center">
                      <a
                        [routerLink]="['/roles', r.id, 'permissions']"
                        nz-tooltip
                        nzTooltipTitle="Configure Menu Permissions"
                        class="btn-tbl-action btn-tbl-neutral text-indigo-600 hover:text-indigo-700"
                        aria-label="Configure Menu Permissions"
                      >
                        <span nz-icon nzType="key"></span>
                      </a>
                      <button
                        type="button"
                        (click)="openEditDrawer(r)"
                        nz-tooltip
                        nzTooltipTitle="Edit Role & Privileges"
                        class="btn-tbl-action btn-tbl-edit"
                        aria-label="Edit Role"
                      >
                        <span nz-icon nzType="edit"></span>
                      </button>
                      <button
                        type="button"
                        (click)="cloneRole(r)"
                        nz-tooltip
                        nzTooltipTitle="Clone Role"
                        class="btn-tbl-action btn-tbl-neutral"
                        aria-label="Clone Role"
                      >
                        <span nz-icon nzType="copy"></span>
                      </button>
                      @if (!r.isSystem) {
                        <button
                          type="button"
                          (click)="deleteRole(r)"
                          nz-tooltip
                          nzTooltipTitle="Delete Role"
                          class="btn-tbl-action btn-tbl-delete"
                          aria-label="Delete Role"
                        >
                          <span nz-icon nzType="delete"></span>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="p-8 text-center text-slate-400 text-xs">
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
          <span class="text-slate-400 font-mono text-[11px]">Dynamic Role & Menu Access Control</span>
        </div>
      </div>
    </div>

    <!-- Create / Edit Role Drawer -->
    <nz-drawer
      [nzVisible]="isDrawerOpen"
      [nzWidth]="540"
      [nzTitle]="drawerMode === 'create' ? 'Create New Role' : 'Edit Role & Special Privileges'"
      [nzFooter]="drawerFooter"
      (nzOnClose)="closeDrawer()"
    >
      <ng-container *nzDrawerContent>
        <div class="space-y-4 py-1">
          <!-- Role Name / Alias -->
          <div>
            <label for="role-alias-input" class="block text-xs font-semibold text-slate-700 mb-1">
              Role Name / Alias <span class="text-rose-500">*</span>
            </label>
            <input
              id="role-alias-input"
              type="text"
              nz-input
              placeholder="e.g. Senior Pharmacist, Cashier Supervisor"
              [(ngModel)]="roleAlias"
              class="rounded-md"
              [disabled]="!!selectedRole?.isSystem"
            />
            @if (selectedRole?.isSystem) {
              <p class="text-[11px] text-amber-600 mt-1">System built-in roles cannot be renamed.</p>
            }
          </div>

          <!-- Description -->
          <div>
            <label for="role-desc-input" class="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              id="role-desc-input"
              nz-input
              rows="2"
              placeholder="Role responsibilities and operational boundaries..."
              [(ngModel)]="roleDescription"
              class="rounded-md"
            ></textarea>
          </div>

          <!-- Status Switch -->
          <div class="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <div class="text-xs font-semibold text-slate-800">Role Status</div>
              <div class="text-[11px] text-slate-500">Active roles can be assigned to branch staff</div>
            </div>
            <nz-switch [(ngModel)]="roleStatus" nzCheckedChildren="Active" nzUnCheckedChildren="Inactive"></nz-switch>
          </div>

          <!-- Always-expanded Special Permissions checklist -->
          <div class="border-t border-slate-200 pt-3">
            <div class="flex items-center justify-between mb-2">
              <div>
                <span class="text-xs font-semibold text-slate-800">Special Operational Privileges</span>
                <p class="text-[11px] text-slate-500 mb-0">High-impact permission flags</p>
              </div>
              <div class="flex gap-1.5">
                <button
                  type="button"
                  (click)="selectAllSpecial()"
                  class="px-2 py-0.5 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded border-0 cursor-pointer font-medium"
                >
                  Select All
                </button>
                <button
                  type="button"
                  (click)="clearAllSpecial()"
                  class="px-2 py-0.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded border-0 cursor-pointer font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div class="space-y-2 mt-2">
              @for (opt of specialOptions; track opt.value) {
                <label
                  class="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                  [class.bg-indigo-50/40]="isSpecialSelected(opt.value)"
                  [class.border-indigo-300]="isSpecialSelected(opt.value)"
                >
                  <input
                    type="checkbox"
                    [checked]="isSpecialSelected(opt.value)"
                    (change)="toggleSpecial(opt.value)"
                    class="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-semibold text-slate-900">{{ opt.label }}</span>
                      <span class="text-xs text-indigo-600 font-medium">({{ opt.label_bn }})</span>
                      <span class="ml-auto text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {{ opt.value }}
                      </span>
                    </div>
                    <p class="text-[11px] text-slate-500 mt-0.5 mb-0 leading-tight">{{ opt.hint }}</p>
                  </div>
                </label>
              }
            </div>
          </div>
        </div>
      </ng-container>

      <ng-template #drawerFooter>
        <div class="flex items-center justify-between w-full">
          <button nz-button nzType="default" (click)="closeDrawer()" class="rounded-md">
            Cancel
          </button>
          <div class="flex items-center gap-2">
            <button
              nz-button
              nzType="primary"
              [nzLoading]="savingRole"
              (click)="saveRole(false)"
              class="rounded-md"
            >
              <span nz-icon nzType="save"></span> Save Role
            </button>
            <button
              nz-button
              nzType="default"
              [nzLoading]="savingRole"
              (click)="saveRole(true)"
              class="rounded-md border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-medium"
            >
              <span nz-icon nzType="key"></span> Save & Set Menu Permissions
            </button>
          </div>
        </div>
      </ng-template>
    </nz-drawer>
  `,
})
export class RoleListComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly roleService = inject(RoleService);
  private readonly router = inject(Router);

  readonly specialOptions: readonly SpecialPermissionOption[] = SPECIAL_PERMISSION_OPTIONS;

  roles = signal<RoleRow[]>([]);
  searchQuery = signal('');

  filteredRoles = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.roles();
    return this.roles().filter(r => r.alias.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q)));
  });

  isDrawerOpen = false;
  drawerMode: 'create' | 'edit' = 'create';
  selectedRoleId = 0;
  selectedRole: RoleRow | null = null;
  roleAlias = '';
  roleDescription = '';
  roleStatus = true;
  selectedSpecialPermissions: string[] = [];
  savingRole = false;

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
            description: r.description || '',
            isSystem: r.is_system,
            status: r.status ?? true,
            permsCount: r.permissions?.length || 0,
            permissions: r.permissions || [],
          }));
          this.roles.set(rows);
        }
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to load roles');
      },
    });
  }

  openCreateDrawer(): void {
    this.drawerMode = 'create';
    this.selectedRole = null;
    this.selectedRoleId = 0;
    this.roleAlias = '';
    this.roleDescription = '';
    this.roleStatus = true;
    this.selectedSpecialPermissions = [];
    this.isDrawerOpen = true;
  }

  openEditDrawer(r: RoleRow): void {
    this.drawerMode = 'edit';
    this.selectedRole = r;
    this.selectedRoleId = r.id;
    this.roleAlias = r.alias;
    this.roleDescription = r.description || '';
    this.roleStatus = r.status;
    this.selectedSpecialPermissions = [...(r.permissions || [])];
    this.isDrawerOpen = true;
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
  }

  cloneRole(r: RoleRow): void {
    this.drawerMode = 'create';
    this.selectedRole = null;
    this.selectedRoleId = 0;
    this.roleAlias = `${r.alias} (Copy)`;
    this.roleDescription = r.description || '';
    this.roleStatus = true;
    this.selectedSpecialPermissions = [...(r.permissions || [])];
    this.isDrawerOpen = true;
  }

  isSpecialSelected(code: string): boolean {
    return this.selectedSpecialPermissions.includes(code);
  }

  toggleSpecial(code: string): void {
    if (this.isSpecialSelected(code)) {
      this.selectedSpecialPermissions = this.selectedSpecialPermissions.filter(p => p !== code);
    } else {
      this.selectedSpecialPermissions = [...this.selectedSpecialPermissions, code];
    }
  }

  selectAllSpecial(): void {
    this.selectedSpecialPermissions = this.specialOptions.map(o => o.value);
  }

  clearAllSpecial(): void {
    this.selectedSpecialPermissions = [];
  }

  saveRole(andNavigateToMenuPermissions: boolean): void {
    if (!this.roleAlias.trim()) {
      this.msg.error('Please enter a role alias');
      return;
    }

    this.savingRole = true;

    const payload: Partial<SysRole> = {
      alias: this.roleAlias.trim(),
      description: this.roleDescription.trim() || undefined,
      status: this.roleStatus,
      is_system: this.selectedRole?.isSystem || false,
      permissions: this.selectedSpecialPermissions,
    };

    const action$ = this.drawerMode === 'create'
      ? this.roleService.createRole(payload)
      : this.roleService.updateRole(this.selectedRoleId, payload);

    action$.subscribe({
      next: (res) => {
        this.savingRole = false;
        const savedId = res.data?.role_no || this.selectedRoleId;
        this.msg.success(res.message || `Role "${this.roleAlias}" saved successfully!`);
        this.isDrawerOpen = false;
        this.loadRoles();

        if (andNavigateToMenuPermissions && savedId) {
          this.router.navigate(['/roles', savedId, 'permissions']);
        }
      },
      error: (err) => {
        this.savingRole = false;
        this.msg.error(err?.error?.message || 'Failed to save role');
      },
    });
  }

  deleteRole(r: RoleRow): void {
    if (r.isSystem) return;

    this.modal.confirmDelete(`role "${r.alias}"`, `Are you sure you want to permanently delete role "${r.alias}"? Users assigned to this role will lose their specific permissions.`).subscribe((confirmed) => {
      if (confirmed) {
        this.roleService.deleteRole(r.id).subscribe({
          next: () => {
            this.msg.success(`Role "${r.alias}" deleted successfully`);
            this.loadRoles();
          },
          error: (err) => {
            this.msg.error(err?.error?.message || 'Failed to delete role');
          },
        });
      }
    });
  }
}

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { RoleService, SysRole } from '../../core/services/role.service';
import { RoleMenuPermissionItem } from '../../core/models/menu.models';

@Component({
  selector: 'app-role-menu-permission',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzCheckboxModule,
    NzSelectModule,
    NzTagModule,
    NzTooltipModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Role Menu Permissions Matrix"
        subtitle="Assign granular permissions (View, Create, Edit, Delete) per menu for each role"
        formId="ROLE_1903"
        [breadcrumbs]="[{ label: 'System', url: '/dashboard' }, { label: 'Roles', url: '/roles' }, { label: 'Menu Permissions' }]"
      >
        <div filters class="flex items-center gap-2 shrink-0 flex-wrap">
          <!-- Role Selector -->
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="text-xs font-semibold text-slate-700">Select Role:</span>
            <nz-select id="role-menu-permission-choose-role-1" nzId="role-menu-permission-choose-role-1"
              class="w-56 shrink-0"
              [ngModel]="selectedRoleNo()"
              (ngModelChange)="onRoleChange($event)"
              nzPlaceHolder="Choose role..." aria-label="Choose role...">
              @for (r of roles(); track r.role_no) {
                <nz-option
                  [nzValue]="r.role_no"
                  [nzLabel]="r.role_name || r.alias"
                ></nz-option>
              }
            </nz-select>
          </div>

          <!-- Search Query -->
          <nz-input-group [nzPrefix]="searchIcon" class="w-52 shrink-0 rounded-md">
            <input id="role-menu-permission-search-menus-2"
              type="text"
              nz-input
              placeholder="Search menus..."
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)" aria-label="Search menus..." />
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
          <button
            nz-button
            nzType="default"
            class="rounded-md text-xs"
            (click)="toggleAllView(true)"
            [disabled]="!selectedRoleNo() || loading()"
          >
            <span nz-icon nzType="eye"></span> All View
          </button>

          <button
            nz-button
            nzType="default"
            class="rounded-md text-xs"
            (click)="toggleAll(true)"
            [disabled]="!selectedRoleNo() || loading()"
          >
            <span nz-icon nzType="check-square"></span> Check All
          </button>

          <button
            nz-button
            nzType="default"
            class="rounded-md text-xs"
            (click)="toggleAll(false)"
            [disabled]="!selectedRoleNo() || loading()"
          >
            <span nz-icon nzType="border"></span> Clear All
          </button>

          <button
            nz-button
            nzType="primary"
            class="rounded-md"
            (click)="savePermissions()"
            [nzLoading]="saving()"
            [disabled]="!selectedRoleNo()"
          >
            <span nz-icon nzType="save"></span> Save Permissions @if (changedCount() > 0) { ({{ changedCount() }}) }
          </button>
        </div>
      </app-page-header>

      <!-- Matrix Card -->
      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        @if (!selectedRoleNo()) {
          <div class="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
            <span nz-icon nzType="safety-certificate" class="text-4xl text-blue-500 mb-3"></span>
            <h4 class="text-base font-semibold text-slate-700">Please Select a Role</h4>
            <p class="text-xs text-slate-500 max-w-sm mt-1">
              Select an authorization role from the dropdown above to view and configure its menu-level access rights.
            </p>
          </div>
        } @else if (loading()) {
          <div class="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
            <span nz-icon nzType="loading" class="text-3xl text-blue-600 mb-3"></span>
            <span class="text-xs font-semibold text-slate-600">Loading role menu permissions...</span>
          </div>
        } @else {
          <!-- Table Scroll Area -->
          <div class="flex-1 min-h-0 overflow-auto w-full max-w-full">
            <table class="w-full text-sm text-left border-collapse min-w-[780px]">
              <thead class="sticky top-0 z-10 bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200 shadow-xs">
                <tr>
                  <th class="p-3 w-16 text-center">ID</th>
                  <th class="p-3">Menu / Screen Title</th>
                  <th class="p-3">Route Path</th>
                  <th class="p-3">Parent Module</th>
                  
                  <!-- Can View Column -->
                  <th class="p-3 text-center w-28 bg-blue-50/50">
                    <div class="flex flex-col items-center gap-1">
                      <span class="text-blue-700 font-bold">Can View</span>
                      <button
                        type="button"
                        class="text-[10px] lowercase text-blue-600 hover:underline cursor-pointer"
                        (click)="toggleColumn('can_view')"
                      >
                        (toggle all)
                      </button>
                    </div>
                  </th>

                  <!-- Can Create Column -->
                  <th class="p-3 text-center w-28 bg-emerald-50/50">
                    <div class="flex flex-col items-center gap-1">
                      <span class="text-emerald-700 font-bold">Can Create</span>
                      <button
                        type="button"
                        class="text-[10px] lowercase text-emerald-600 hover:underline cursor-pointer"
                        (click)="toggleColumn('can_create')"
                      >
                        (toggle all)
                      </button>
                    </div>
                  </th>

                  <!-- Can Edit Column -->
                  <th class="p-3 text-center w-28 bg-amber-50/50">
                    <div class="flex flex-col items-center gap-1">
                      <span class="text-amber-700 font-bold">Can Edit</span>
                      <button
                        type="button"
                        class="text-[10px] lowercase text-amber-600 hover:underline cursor-pointer"
                        (click)="toggleColumn('can_edit')"
                      >
                        (toggle all)
                      </button>
                    </div>
                  </th>

                  <!-- Can Delete Column -->
                  <th class="p-3 text-center w-28 bg-rose-50/50">
                    <div class="flex flex-col items-center gap-1">
                      <span class="text-rose-700 font-bold">Can Delete</span>
                      <button
                        type="button"
                        class="text-[10px] lowercase text-rose-600 hover:underline cursor-pointer"
                        (click)="toggleColumn('can_delete')"
                      >
                        (toggle all)
                      </button>
                    </div>
                  </th>

                  <!-- Row Quick Actions -->
                  <th class="p-3 text-center w-24">Row Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-800">
                @for (item of filteredItems(); track item.menu_no) {
                  <tr
                    class="hover:bg-slate-50/70 transition-colors"
                    [class.bg-blue-50/20]="!item.parent_menu_no"
                  >
                    <td class="p-3 text-center font-mono text-xs text-slate-400">
                      #{{ item.menu_no }}
                    </td>
                    <td class="p-3">
                      <div class="flex items-center gap-2">
                        @if (item.icon) {
                          <span nz-icon [nzType]="item.icon" class="text-blue-600 text-sm"></span>
                        } @else {
                          <span nz-icon nzType="file" class="text-slate-400 text-sm"></span>
                        }
                        <div>
                          <span class="font-semibold text-slate-900" [class.text-blue-900]="!item.parent_menu_no">
                            {{ item.title }}
                          </span>
                          @if (!item.parent_menu_no) {
                            <nz-tag nzColor="blue" class="text-[10px] ml-1.5 font-mono">Module Root</nz-tag>
                          }
                        </div>
                      </div>
                    </td>
                    <td class="p-3 font-mono text-xs text-slate-500">
                      {{ item.path || '—' }}
                    </td>
                    <td class="p-3 text-xs text-slate-600">
                      @if (item.parent_title) {
                        <span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">
                          {{ item.parent_title }}
                        </span>
                      } @else {
                        <span class="text-slate-400 italic">None (Root)</span>
                      }
                    </td>

                    <!-- View Checkbox -->
                    <td class="p-3 text-center bg-blue-50/20">
                      <label
                        nz-checkbox
                        [(ngModel)]="item.can_view"
                        (ngModelChange)="onViewChanged(item)"
                      ></label>
                    </td>

                    <!-- Create Checkbox -->
                    <td class="p-3 text-center bg-emerald-50/20">
                      <label
                        nz-checkbox
                        [(ngModel)]="item.can_create"
                        (ngModelChange)="onCreateEditDeleteChanged(item)"
                      ></label>
                    </td>

                    <!-- Edit Checkbox -->
                    <td class="p-3 text-center bg-amber-50/20">
                      <label
                        nz-checkbox
                        [(ngModel)]="item.can_edit"
                        (ngModelChange)="onCreateEditDeleteChanged(item)"
                      ></label>
                    </td>

                    <!-- Delete Checkbox -->
                    <td class="p-3 text-center bg-rose-50/20">
                      <label
                        nz-checkbox
                        [(ngModel)]="item.can_delete"
                        (ngModelChange)="onCreateEditDeleteChanged(item)"
                      ></label>
                    </td>

                    <!-- Row Action Buttons -->
                    <td class="p-3 text-center">
                      <div class="inline-flex items-center gap-1 justify-center">
                        <button
                          type="button"
                          class="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          (click)="toggleRow(item, true)"
                          title="Grant All Rights for this menu"
                         aria-label="Grant All Rights for this menu">
                          All
                        </button>
                        <button
                          type="button"
                          class="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                          (click)="toggleRow(item, false)"
                          title="Revoke All Rights for this menu"
                         aria-label="Revoke All Rights for this menu">
                          None
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="9" class="p-8 text-center text-slate-400 text-xs">
                      No menus match your search criteria.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Sticky Bottom Footer -->
          <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
            <div class="flex items-center gap-4">
              <span>Target Role: <strong class="text-blue-700 font-semibold font-mono">{{ activeRoleName() }}</strong></span>
              <span>Total Menus: <strong class="text-slate-900 font-semibold font-mono">{{ permissionItems().length }}</strong></span>
              <span>Accessible Menus (View): <strong class="text-emerald-700 font-semibold font-mono">{{ viewCount() }}</strong></span>
              <span>Pending Changes: <strong class="text-amber-600 font-semibold font-mono">{{ changedCount() }}</strong></span>
            </div>
            <span class="text-slate-400 font-mono text-[11px]">Pharmacy Multi-Tenant RBAC Security</span>
          </div>
        }
      </div>
    </div>
  `,
})
export class RoleMenuPermissionComponent implements OnInit {
  private readonly roleService = inject(RoleService);
  private readonly message = inject(NzMessageService);
  private readonly route = inject(ActivatedRoute);

  private readonly originalPermissionsMap = new Map<number, {
    role_menu_perm_no?: number | null;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
  }>();

  readonly roles = signal<SysRole[]>([]);
  readonly selectedRoleNo = signal<number | null>(null);
  readonly permissionItems = signal<RoleMenuPermissionItem[]>([]);
  readonly searchQuery = signal('');
  readonly dirtyRevision = signal(0);

  readonly loading = signal(false);
  readonly saving = signal(false);

  private markDirty(): void {
    this.dirtyRevision.update((v) => v + 1);
  }

  readonly changedCount = computed(() => {
    this.dirtyRevision();
    return this.getChangedItems().length;
  });

  readonly activeRoleName = computed(() => {
    const rNo = this.selectedRoleNo();
    if (!rNo) return 'None';
    const role = this.roles().find((r) => r.role_no === rNo);
    return role ? role.role_name || role.alias : `#${rNo}`;
  });

  readonly viewCount = computed(() => {
    return this.permissionItems().filter((i) => i.can_view).length;
  });

  readonly filteredItems = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.permissionItems();

    return this.permissionItems().filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        (item.path && item.path.toLowerCase().includes(q)) ||
        (item.parent_title && item.parent_title.toLowerCase().includes(q))
      );
    });
  });

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.roles.set(res.data);

          const roleList = res.data;
          const paramId = this.route.snapshot.paramMap.get('id');
          const queryId = this.route.snapshot.queryParamMap.get('roleNo');
          const initialId = paramId ? Number(paramId) : (queryId ? Number(queryId) : 0);

          if (initialId && !isNaN(initialId)) {
            this.selectedRoleNo.set(initialId);
            this.loadRolePermissions(initialId);
          } else if (roleList.length > 0 && !this.selectedRoleNo()) {
            this.selectedRoleNo.set(roleList[0].role_no);
            this.loadRolePermissions(roleList[0].role_no);
          }

          this.route.paramMap.subscribe((params) => {
            const id = params.get('id');
            if (id) {
              const rNo = Number(id);
              if (rNo !== this.selectedRoleNo()) {
                this.selectedRoleNo.set(rNo);
                this.loadRolePermissions(rNo);
              }
            }
          });

          this.route.queryParams.subscribe((params) => {
            if (params['roleNo']) {
              const rNo = Number(params['roleNo']);
              if (rNo !== this.selectedRoleNo()) {
                this.selectedRoleNo.set(rNo);
                this.loadRolePermissions(rNo);
              }
            }
          });
        }
      },
      error: (err) => {
        this.message.error(err?.error?.message || 'Failed to load roles');
      },
    });
  }

  onRoleChange(roleNo: number | null): void {
    this.selectedRoleNo.set(roleNo);
    if (roleNo) {
      this.loadRolePermissions(roleNo);
    } else {
      this.permissionItems.set([]);
    }
  }

  loadRolePermissions(roleNo: number): void {
    this.loading.set(true);
    this.roleService.getRoleMenuPermissions(roleNo).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.permissionItems.set(res.data);
          this.originalPermissionsMap.clear();
          for (const item of res.data) {
            this.originalPermissionsMap.set(item.menu_no, {
              role_menu_perm_no: item.role_menu_perm_no ?? null,
              can_view: !!item.can_view,
              can_create: !!item.can_create,
              can_edit: !!item.can_edit,
              can_delete: !!item.can_delete,
            });
          }
          this.markDirty();
        } else {
          this.message.error(res.message || 'Failed to load permissions');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.message.error(err?.error?.message || 'Failed to load permissions');
      },
    });
  }

  getChangedItems(): RoleMenuPermissionItem[] {
    const changed: RoleMenuPermissionItem[] = [];
    for (const item of this.permissionItems()) {
      const orig = this.originalPermissionsMap.get(item.menu_no);
      const v = !!item.can_view;
      const c = !!item.can_create;
      const e = !!item.can_edit;
      const d = !!item.can_delete;

      if (!orig || orig.can_view !== v || orig.can_create !== c || orig.can_edit !== e || orig.can_delete !== d) {
        changed.push({
          role_menu_perm_no: orig?.role_menu_perm_no ?? item.role_menu_perm_no ?? null,
          menu_no: item.menu_no,
          menu_code: item.menu_code,
          title: item.title,
          order_no: item.order_no,
          can_view: v,
          can_create: c,
          can_edit: e,
          can_delete: d,
        });
      }
    }
    return changed;
  }

  onViewChanged(item: RoleMenuPermissionItem): void {
    // If view is disabled, disable create, edit, delete as well
    if (!item.can_view) {
      item.can_create = false;
      item.can_edit = false;
      item.can_delete = false;
    }
    this.markDirty();
  }

  onCreateEditDeleteChanged(item: RoleMenuPermissionItem): void {
    // If create, edit, or delete is enabled, automatically enable view
    if (item.can_create || item.can_edit || item.can_delete) {
      item.can_view = true;
    }
    this.markDirty();
  }

  toggleRow(item: RoleMenuPermissionItem, grant: boolean): void {
    item.can_view = grant;
    item.can_create = grant;
    item.can_edit = grant;
    item.can_delete = grant;
    this.markDirty();
  }

  toggleAll(grant: boolean): void {
    this.permissionItems.update((items) =>
      items.map((i) => ({
        ...i,
        can_view: grant,
        can_create: grant,
        can_edit: grant,
        can_delete: grant,
      }))
    );
    this.markDirty();
  }

  toggleAllView(grant: boolean): void {
    this.permissionItems.update((items) =>
      items.map((i) => ({
        ...i,
        can_view: grant,
      }))
    );
    this.markDirty();
  }

  toggleColumn(column: 'can_view' | 'can_create' | 'can_edit' | 'can_delete'): void {
    const items = this.permissionItems();
    const allChecked = items.every((i) => i[column]);
    const newState = !allChecked;

    this.permissionItems.update((list) =>
      list.map((i) => {
        const updated = { ...i, [column]: newState };
        if (column !== 'can_view' && newState) {
          updated.can_view = true;
        } else if (column === 'can_view' && !newState) {
          updated.can_create = false;
          updated.can_edit = false;
          updated.can_delete = false;
        }
        return updated;
      })
    );
    this.markDirty();
  }

  savePermissions(): void {
    const rNo = this.selectedRoleNo();
    if (!rNo) return;

    const changedItems = this.getChangedItems();
    if (changedItems.length === 0) {
      this.message.info('No changes detected to save');
      return;
    }

    this.saving.set(true);
    this.roleService.saveRoleMenuPermissions(rNo, changedItems).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.success) {
          this.message.success(`Saved ${changedItems.length} menu permission change(s) successfully`);
          // Update baseline snapshot with the saved changes
          for (const item of changedItems) {
            const orig = this.originalPermissionsMap.get(item.menu_no);
            if (orig) {
              orig.can_view = item.can_view;
              orig.can_create = item.can_create;
              orig.can_edit = item.can_edit;
              orig.can_delete = item.can_delete;
            } else {
              this.originalPermissionsMap.set(item.menu_no, {
                role_menu_perm_no: item.role_menu_perm_no ?? null,
                can_view: item.can_view,
                can_create: item.can_create,
                can_edit: item.can_edit,
                can_delete: item.can_delete,
              });
            }
          }
          this.markDirty();
        } else {
          this.message.error(res.message || 'Failed to save menu permissions');
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.message.error(err?.error?.message || 'Failed to save menu permissions');
      },
    });
  }
}

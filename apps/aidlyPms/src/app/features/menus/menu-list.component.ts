import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { MenuService } from '../../core/services/menu.service';
import { SysMenu } from '../../core/models/menu.models';

@Component({
  selector: 'app-menu-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzIconModule,
    NzTagModule,
    NzTooltipModule,
    NzSelectModule,
    NzSwitchModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Menu Management"
        subtitle="Manage system navigation routes, icons, parent hierarchy, and availability"
        formId="MENU_1904"
        [breadcrumbs]="[{ label: 'System', url: '/dashboard' }, { label: 'Menus' }]"
      >
        <div filters class="flex items-center gap-2 shrink-0 flex-nowrap">
          <nz-input-group [nzPrefix]="searchIcon" class="w-64 shrink-0 rounded-md">
            <input
              type="text"
              nz-input
              placeholder="Search by title or path..."
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
            />
          </nz-input-group>
          <ng-template #searchIcon>
            <span nz-icon nzType="search" class="text-slate-400"></span>
          </ng-template>

          <nz-select
            class="w-48 shrink-0"
            [ngModel]="parentFilter()"
            (ngModelChange)="parentFilter.set($event)"
            nzPlaceHolder="Filter by parent"
          >
            <nz-option nzValue="ALL" nzLabel="All Menus"></nz-option>
            <nz-option nzValue="ROOT" nzLabel="Root Modules Only"></nz-option>
            @for (p of rootMenus(); track p.menu_no) {
              <nz-option [nzValue]="p.menu_no.toString()" [nzLabel]="p.title"></nz-option>
            }
          </nz-select>

          <button nz-button nzType="default" class="rounded-md h-7 px-2.5 text-xs shrink-0" (click)="resetFilters()">
            <span nz-icon nzType="clear"></span> Reset
          </button>
        </div>

        <div actions class="flex items-center gap-2 shrink-0 flex-nowrap">
          <a nz-button nzType="default" routerLink="/roles/permissions" class="rounded-md">
            <span nz-icon nzType="key"></span> Role Permissions
          </a>
          <a nz-button nzType="default" routerLink="/menus/add" class="rounded-md">
            <span nz-icon nzType="plus"></span> Add Menu Form
          </a>
          <button nz-button nzType="primary" class="rounded-md" (click)="openCreateModal()">
            <span nz-icon nzType="plus"></span> Quick Add (F2)
          </button>
        </div>
      </app-page-header>

      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <!-- Table Scroll Area -->
        <div class="flex-1 min-h-0 overflow-auto">
          <table class="w-full text-sm text-left border-collapse">
            <thead class="sticky top-0 z-10 bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200 shadow-xs">
              <tr>
                <th class="p-3 w-16 text-center">ID</th>
                <th class="p-3">Title & Icon</th>
                <th class="p-3">Path / Route</th>
                <th class="p-3">Parent Module</th>
                <th class="p-3 w-20 text-center">Order</th>
                <th class="p-3 w-24 text-center">Status</th>
                <th class="p-3 text-center w-32">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              @for (m of filteredMenus(); track m.menu_no) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="p-3 text-center font-mono text-xs text-slate-400">#{{ m.menu_no }}</td>
                  <td class="p-3">
                    <div class="flex items-center gap-2">
                      @if (m.icon) {
                        <span nz-icon [nzType]="m.icon" class="text-blue-600 text-base"></span>
                      } @else {
                        <span nz-icon nzType="folder" class="text-slate-400 text-base"></span>
                      }
                      <div>
                        <span class="font-semibold text-slate-900">{{ m.title }}</span>
                        @if (!m.parent_menu_no) {
                          <nz-tag nzColor="blue" class="text-[10px] ml-2 font-mono">Root Module</nz-tag>
                        }
                      </div>
                    </div>
                  </td>
                  <td class="p-3 font-mono text-xs text-slate-600">
                    {{ m.path || '—' }}
                  </td>
                  <td class="p-3 text-xs text-slate-600">
                    @if (m.parent_title) {
                      <span class="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">
                        <span nz-icon nzType="apartment" class="text-[10px]"></span> {{ m.parent_title }}
                      </span>
                    } @else {
                      <span class="text-slate-400 italic">None (Top Level)</span>
                    }
                  </td>
                  <td class="p-3 text-center font-mono text-xs font-semibold">
                    {{ m.order_no }}
                  </td>
                  <td class="p-3 text-center">
                    @if (m.status) {
                      <nz-tag nzColor="success" class="text-xs">Active</nz-tag>
                    } @else {
                      <nz-tag nzColor="error" class="text-xs">Inactive</nz-tag>
                    }
                  </td>
                  <td class="p-3 text-center">
                    <div class="inline-flex items-center gap-1.5 justify-center">
                      <button
                        type="button"
                        (click)="openEditModal(m)"
                        nz-tooltip
                        nzTooltipTitle="Edit Menu"
                        class="btn-tbl-action btn-tbl-edit"
                      >
                        <span nz-icon nzType="edit"></span>
                      </button>
                      <button
                        type="button"
                        (click)="toggleStatus(m)"
                        nz-tooltip
                        [nzTooltipTitle]="m.status ? 'Deactivate Menu' : 'Activate Menu'"
                        class="btn-tbl-action btn-tbl-neutral text-amber-600 hover:text-amber-700"
                      >
                        <span nz-icon [nzType]="m.status ? 'pause-circle' : 'play-circle'"></span>
                      </button>
                      <button
                        type="button"
                        (click)="deleteMenu(m)"
                        nz-tooltip
                        nzTooltipTitle="Delete Menu"
                        class="btn-tbl-action btn-tbl-delete"
                      >
                        <span nz-icon nzType="delete"></span>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="p-8 text-center text-slate-400 text-xs">
                    No menus match your current search or filter.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Sticky Bottom Footer -->
        <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div class="flex items-center gap-4">
            <span>Total Menus: <strong class="text-slate-900 font-semibold font-mono">{{ menus().length }}</strong></span>
            <span>Filtered: <strong class="text-slate-900 font-semibold font-mono">{{ filteredMenus().length }}</strong></span>
            <span>Root Modules: <strong class="text-slate-900 font-semibold font-mono">{{ rootMenus().length }}</strong></span>
          </div>
          <span class="text-slate-400 font-mono text-[11px]">Aidly PMS Global Navigation Catalog</span>
        </div>
      </div>

      <!-- Quick Add/Edit Modal -->
      <nz-modal
        [(nzVisible)]="modalVisible"
        [nzTitle]="isEditing() ? 'Edit System Menu' : 'Add System Menu'"
        (nzOnCancel)="closeModal()"
        (nzOnOk)="saveMenuFromModal()"
        [nzOkLoading]="modalSaving()"
        [nzOkText]="isEditing() ? 'Update Menu' : 'Create Menu'"
      >
        <ng-container *nzModalContent>
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Menu Title <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                nz-input
                placeholder="e.g. Sales Invoice Register"
                [(ngModel)]="formTitle"
                class="rounded-md"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Route Path
                </label>
                <input
                  type="text"
                  nz-input
                  placeholder="e.g. /customer/sale"
                  [(ngModel)]="formPath"
                  class="rounded-md"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Ant Design Icon
                </label>
                <input
                  type="text"
                  nz-input
                  placeholder="e.g. shopping-cart, file-text"
                  [(ngModel)]="formIcon"
                  class="rounded-md"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Parent Menu (Optional)
                </label>
                <nz-select
                  class="w-full"
                  [(ngModel)]="formParentNo"
                  nzPlaceHolder="None (Root Module)"
                  nzAllowClear
                >
                  @for (p of rootMenus(); track p.menu_no) {
                    <nz-option [nzValue]="p.menu_no" [nzLabel]="p.title"></nz-option>
                  }
                </nz-select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  nz-input
                  [(ngModel)]="formOrderNo"
                  min="1"
                  class="rounded-md"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Active Status
              </label>
              <div class="flex items-center gap-2">
                <nz-switch [(ngModel)]="formStatus"></nz-switch>
                <span class="text-xs text-slate-600">{{ formStatus ? 'Active in navigation' : 'Inactive / Hidden' }}</span>
              </div>
            </div>
          </div>
        </ng-container>
      </nz-modal>
    </div>
  `,
})
export class MenuListComponent implements OnInit {
  private readonly menuService = inject(MenuService);
  private readonly message = inject(NzMessageService);

  readonly menus = signal<SysMenu[]>([]);
  readonly searchQuery = signal('');
  readonly parentFilter = signal<string>('ALL');

  readonly modalVisible = signal(false);
  readonly isEditing = signal(false);
  readonly modalSaving = signal(false);
  readonly editingMenuNo = signal<number | null>(null);

  formTitle = '';
  formPath = '';
  formIcon = '';
  formParentNo: number | null = null;
  formOrderNo = 1;
  formStatus = true;

  readonly rootMenus = computed(() => {
    return this.menus().filter((m) => !m.parent_menu_no);
  });

  readonly filteredMenus = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const pf = this.parentFilter();

    return this.menus().filter((m) => {
      const matchQuery =
        !q ||
        m.title.toLowerCase().includes(q) ||
        (m.path && m.path.toLowerCase().includes(q)) ||
        (m.parent_title && m.parent_title.toLowerCase().includes(q));

      if (!matchQuery) return false;

      if (pf === 'ALL') return true;
      if (pf === 'ROOT') return !m.parent_menu_no;
      return m.parent_menu_no?.toString() === pf;
    });
  });

  ngOnInit(): void {
    this.loadMenus();
  }

  loadMenus(): void {
    this.menuService.getMenus().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.menus.set(res.data);
        }
      },
      error: (err) => {
        this.message.error(err?.error?.message || 'Failed to load menus');
      },
    });
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.parentFilter.set('ALL');
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.editingMenuNo.set(null);
    this.formTitle = '';
    this.formPath = '';
    this.formIcon = '';
    this.formParentNo = null;
    this.formOrderNo = this.menus().length + 1;
    this.formStatus = true;
    this.modalVisible.set(true);
  }

  openEditModal(m: SysMenu): void {
    this.isEditing.set(true);
    this.editingMenuNo.set(m.menu_no);
    this.formTitle = m.title;
    this.formPath = m.path || '';
    this.formIcon = m.icon || '';
    this.formParentNo = m.parent_menu_no || null;
    this.formOrderNo = m.order_no;
    this.formStatus = m.status;
    this.modalVisible.set(true);
  }

  closeModal(): void {
    this.modalVisible.set(false);
  }

  saveMenuFromModal(): void {
    if (!this.formTitle.trim()) {
      this.message.warning('Menu title is required');
      return;
    }

    this.modalSaving.set(true);

    const payload: Partial<SysMenu> = {
      title: this.formTitle.trim(),
      path: this.formPath.trim() || null,
      icon: this.formIcon.trim() || null,
      parent_menu_no: this.formParentNo,
      order_no: Number(this.formOrderNo) || 1,
      status: this.formStatus,
    };

    if (this.isEditing() && this.editingMenuNo()) {
      this.menuService.updateMenu(this.editingMenuNo()!, payload).subscribe({
        next: (res) => {
          this.modalSaving.set(false);
          if (res.success) {
            this.message.success('Menu updated successfully');
            this.modalVisible.set(false);
            this.loadMenus();
          } else {
            this.message.error(res.message || 'Failed to update menu');
          }
        },
        error: (err) => {
          this.modalSaving.set(false);
          this.message.error(err?.error?.message || 'Failed to update menu');
        },
      });
    } else {
      this.menuService.createMenu(payload).subscribe({
        next: (res) => {
          this.modalSaving.set(false);
          if (res.success) {
            this.message.success('Menu created successfully');
            this.modalVisible.set(false);
            this.loadMenus();
          } else {
            this.message.error(res.message || 'Failed to create menu');
          }
        },
        error: (err) => {
          this.modalSaving.set(false);
          this.message.error(err?.error?.message || 'Failed to create menu');
        },
      });
    }
  }

  toggleStatus(m: SysMenu): void {
    const updatedStatus = !m.status;
    this.menuService
      .updateMenu(m.menu_no, {
        title: m.title,
        path: m.path,
        icon: m.icon,
        parent_menu_no: m.parent_menu_no,
        order_no: m.order_no,
        status: updatedStatus,
      })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.message.success(`Menu "${m.title}" status updated`);
            this.loadMenus();
          } else {
            this.message.error(res.message || 'Status update failed');
          }
        },
        error: (err) => {
          this.message.error(err?.error?.message || 'Status update failed');
        },
      });
  }

  deleteMenu(m: SysMenu): void {
    if (confirm(`Are you sure you want to delete the menu "${m.title}"?`)) {
      this.menuService.deleteMenu(m.menu_no).subscribe({
        next: (res) => {
          if (res.success) {
            this.message.success('Menu deleted successfully');
            this.loadMenus();
          } else {
            this.message.error(res.message || 'Failed to delete menu');
          }
        },
        error: (err) => {
          this.message.error(err?.error?.message || 'Failed to delete menu');
        },
      });
    }
  }
}

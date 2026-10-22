import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { MenuService } from '../../core/services/menu.service';
import { SysMenu } from '../../core/models/menu.models';

const POPULAR_ICONS = [
  'shopping-cart',
  'thunderbolt',
  'shop',
  'medicine-box',
  'calculator',
  'setting',
  'team',
  'file-text',
  'credit-card',
  'rollback',
  'import',
  'file-done',
  'contacts',
  'dollar',
  'swap',
  'database',
  'plus-circle',
  'history',
  'sliders',
  'deployment-unit',
  'audit',
  'file-protect',
  'red-envelope',
  'apartment',
  'line-chart',
  'safety',
  'menu',
  'key',
  'tool',
  'idcard',
];

@Component({
  selector: 'app-menu-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzSelectModule,
    NzSwitchModule,
    NzTagModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="max-w-4xl space-y-4">
      <app-page-header
        [title]="isEditMode() ? 'Edit System Menu' : 'Create System Menu'"
        subtitle="Manage navigation route, parent module hierarchy, icon, and operational status"
        formId="MENU_1905"
        [breadcrumbs]="[{ label: 'System', url: '/dashboard' }, { label: 'Menus', url: '/menus' }, { label: isEditMode() ? 'Edit Menu' : 'Create Menu' }]"
      >
        <div actions class="flex items-center gap-2">
          <button nz-button nzType="default" (click)="goBack()" class="rounded-md">
            <span nz-icon nzType="arrow-left"></span> Back to Menus
          </button>
        </div>
      </app-page-header>

      <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <form (ngSubmit)="submitMenu()" class="space-y-6">
          <!-- Basic Info -->
          <div>
            <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <span nz-icon nzType="info-circle" class="text-blue-600"></span> Menu Details
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Title -->
              <div class="md:col-span-2">
                <label for="menu-form-menu-title-1" class="block text-xs font-semibold text-slate-700 mb-1">
                  Menu Title <span class="text-rose-500">*</span>
                </label>
                <input id="menu-form-menu-title-1"
                  type="text"
                  nz-input
                  placeholder="e.g. Sales Invoice Register or Master Medicine Catalog"
                  [(ngModel)]="menuTitle"
                  name="menuTitle"
                  class="rounded-md"
                  required aria-label="Menu Title" />
                <span class="text-[11px] text-slate-400 mt-1 block">Display name shown on sidebar and breadcrumbs</span>
              </div>

              <!-- Path -->
              <div>
                <label for="menu-form-route-path-url-2" class="block text-xs font-semibold text-slate-700 mb-1">
                  Route Path (URL)
                </label>
                <input id="menu-form-route-path-url-2"
                  type="text"
                  nz-input
                  placeholder="e.g. /customer/sales-register"
                  [(ngModel)]="menuPath"
                  name="menuPath"
                  class="rounded-md" aria-label="Route Path (URL)" />
                <span class="text-[11px] text-slate-400 mt-1 block">Angular client route starting with /</span>
              </div>

              <!-- Parent Menu -->
              <div>
                <label for="menu-form-parent-menu-hierarchy-3" class="block text-xs font-semibold text-slate-700 mb-1">
                  Parent Menu (Hierarchy)
                </label>
                <nz-select id="menu-form-parent-menu-hierarchy-3" nzId="menu-form-parent-menu-hierarchy-3"
                  class="w-full"
                  [(ngModel)]="selectedParentNo"
                  name="selectedParentNo"
                  nzPlaceHolder="None (Top-Level Root Module)"
                  nzAllowClear aria-label="Parent Menu (Hierarchy)">
                  @for (p of rootMenus(); track p.menu_no) {
                    <nz-option [nzValue]="p.menu_no" [nzLabel]="p.title"></nz-option>
                  }
                </nz-select>
                <span class="text-[11px] text-slate-400 mt-1 block">Leave empty to create a top-level parent module</span>
              </div>

              <!-- Display Order -->
              <div>
                <label for="menu-form-display-order-sequence-4" class="block text-xs font-semibold text-slate-700 mb-1">
                  Display Order Sequence
                </label>
                <input id="menu-form-display-order-sequence-4"
                  type="number"
                  nz-input
                  [(ngModel)]="orderNo"
                  name="orderNo"
                  min="1"
                  class="rounded-md" aria-label="Display Order Sequence" />
                <span class="text-[11px] text-slate-400 mt-1 block">Ordering priority inside the sidebar group</span>
              </div>

              <!-- Status Toggle -->
              <div>
                <label for="menu-form-e-g-shopping-cart-shop-medicin-5" class="block text-xs font-semibold text-slate-700 mb-1">
                  Active Status
                </label>
                <div class="flex items-center gap-3 pt-1">
                  <nz-switch [(ngModel)]="status" name="status"></nz-switch>
                  <span class="text-xs font-medium" [class.text-emerald-600]="status" [class.text-rose-500]="!status">
                    {{ status ? 'Active (Visible in system)' : 'Inactive (Hidden)' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Icon Selector & Preview -->
          <div class="pt-2">
            <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <span nz-icon nzType="appstore" class="text-blue-600"></span> Icon Selection & Preview
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div class="md:col-span-2 space-y-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">
                    Ant Design Icon Identifier
                  </label>
                  <input id="menu-form-e-g-shopping-cart-shop-medicin-5"
                    type="text"
                    nz-input
                    placeholder="e.g. shopping-cart, shop, medicine-box, setting"
                    [(ngModel)]="icon"
                    name="icon"
                    class="rounded-md" aria-label="e.g. shopping-cart, shop, medicine-box, setting" />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1.5">
                    Or select from suggested icons:
                  </label>
                  <div class="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                    @for (ic of popularIcons; track ic) {
                      <button
                        type="button"
                        (click)="icon = ic"
                        class="p-1.5 rounded hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-300 transition-all text-sm flex items-center justify-center w-8 h-8"
                        [class.bg-blue-100]="icon === ic"
                        [class.border-blue-400]="icon === ic"
                        [title]="ic"
                       [attr.aria-label]="ic">
                        <span nz-icon [nzType]="ic" [class.text-blue-600]="icon === ic" class="text-slate-700"></span>
                      </button>
                    }
                  </div>
                </div>
              </div>

              <!-- Live Preview Card -->
              <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <span class="text-xs text-slate-400 uppercase font-semibold mb-2">Live Sidebar Preview</span>
                <div class="w-full flex items-center gap-3 p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <span nz-icon [nzType]="icon || 'folder'" class="text-blue-600 text-lg"></span>
                  <div class="text-left overflow-hidden">
                    <div class="text-xs font-semibold text-slate-800 truncate">{{ menuTitle || 'Menu Title' }}</div>
                    <div class="text-[10px] text-slate-400 font-mono truncate">{{ menuPath || '/route/path' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button nz-button nzType="default" type="button" (click)="goBack()" class="rounded-md">
              Cancel
            </button>
            <button
              nz-button
              nzType="primary"
              type="submit"
              [nzLoading]="submitting()"
              class="rounded-md px-6"
            >
              <span nz-icon [nzType]="isEditMode() ? 'save' : 'plus'"></span>
              {{ isEditMode() ? 'Save Changes' : 'Create Menu' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class MenuFormComponent implements OnInit {
  private readonly menuService = inject(MenuService);
  private readonly message = inject(NzMessageService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isEditMode = signal(false);
  readonly submitting = signal(false);
  readonly menus = signal<SysMenu[]>([]);
  readonly rootMenus = signal<SysMenu[]>([]);

  menuId: number | null = null;
  menuTitle = '';
  menuPath = '';
  icon = 'appstore';
  selectedParentNo: number | null = null;
  orderNo = 1;
  status = true;

  readonly popularIcons = POPULAR_ICONS;

  ngOnInit(): void {
    this.loadMenus();

    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.menuId = Number(params['id']);
        this.isEditMode.set(true);
        this.loadMenuDetail(this.menuId);
      }
    });
  }

  loadMenus(): void {
    this.menuService.getMenus().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.menus.set(res.data);
          this.rootMenus.set(res.data.filter((m) => !m.parent_menu_no));
          if (!this.isEditMode()) {
            this.orderNo = res.data.length + 1;
          }
        }
      },
    });
  }

  loadMenuDetail(id: number): void {
    this.menuService.getMenuById(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const m = res.data;
          this.menuTitle = m.title;
          this.menuPath = m.path || '';
          this.icon = m.icon || 'appstore';
          this.selectedParentNo = m.parent_menu_no || null;
          this.orderNo = m.order_no;
          this.status = m.status;
        } else {
          this.message.error('Failed to load menu details');
          this.goBack();
        }
      },
      error: () => {
        this.message.error('Failed to load menu details');
        this.goBack();
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/menus']);
  }

  submitMenu(): void {
    if (!this.menuTitle.trim()) {
      this.message.warning('Menu title is required');
      return;
    }

    this.submitting.set(true);

    const payload: Partial<SysMenu> = {
      title: this.menuTitle.trim(),
      path: this.menuPath.trim() || null,
      icon: this.icon.trim() || null,
      parent_menu_no: this.selectedParentNo,
      order_no: Number(this.orderNo) || 1,
      status: this.status,
    };

    if (this.isEditMode() && this.menuId) {
      this.menuService.updateMenu(this.menuId, payload).subscribe({
        next: (res) => {
          this.submitting.set(false);
          if (res.success) {
            this.message.success('Menu updated successfully');
            this.router.navigate(['/menus']);
          } else {
            this.message.error(res.message || 'Failed to update menu');
          }
        },
        error: (err) => {
          this.submitting.set(false);
          this.message.error(err?.error?.message || 'Failed to update menu');
        },
      });
    } else {
      this.menuService.createMenu(payload).subscribe({
        next: (res) => {
          this.submitting.set(false);
          if (res.success) {
            this.message.success('Menu created successfully');
            this.router.navigate(['/menus']);
          } else {
            this.message.error(res.message || 'Failed to create menu');
          }
        },
        error: (err) => {
          this.submitting.set(false);
          this.message.error(err?.error?.message || 'Failed to create menu');
        },
      });
    }
  }
}

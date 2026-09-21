import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { AuthService } from '../../core/auth/auth.service';
import { getScreenByRoute, getScreenByFormId, SystemScreen } from '../../core/config/menu.config';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzButtonModule,
    NzIconModule,
    NzDropDownModule,
    NzBadgeModule,
    NzTooltipModule,
  ],
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .header-bar {
      background: #101723;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      color: #ffffff;
    }
    .header-title {
      color: #ffffff !important;
      font-size: 15px;
      font-weight: 700;
      line-height: 1.2;
    }
    .header-form-badge {
      background: rgba(99, 102, 241, 0.2) !important;
      color: #a5b4fc !important;
      border: 1px solid rgba(99, 102, 241, 0.4) !important;
    }
    .header-toggle-btn {
      background: rgba(99, 102, 241, 0.12) !important;
      border: 1px solid rgba(99, 102, 241, 0.3) !important;
      color: #c7d2fe !important;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .header-toggle-btn:hover {
      background: rgba(99, 102, 241, 0.25) !important;
      border-color: #818cf8 !important;
      color: #ffffff !important;
    }
    .header-icon-btn {
      background: rgba(255, 255, 255, 0.06) !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      color: #e2e8f0 !important;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .header-icon-btn:hover {
      background: rgba(255, 255, 255, 0.14) !important;
      color: #ffffff !important;
    }
    .header-branch-pill {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #e2e8f0;
    }
    .header-user-btn {
      color: #ffffff !important;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    .header-user-btn:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    .header-user-title {
      color: #ffffff !important;
      font-weight: 600;
      font-size: 12px;
      line-height: 1.2;
    }
    .header-user-sub {
      color: #94a3b8 !important;
      font-size: 10px;
      line-height: 1.2;
    }
    .header-user-chevron {
      color: #94a3b8 !important;
      font-size: 10px;
    }
  `],
  template: `
    <header class="header-bar h-12 flex items-center px-4 gap-3 shrink-0 shadow-sm">
      <!-- Sidebar Toggle Button -->
      <button
        type="button"
        (click)="toggleCollapse.emit()"
        class="header-toggle-btn w-8 h-8 flex items-center justify-center rounded-lg"
        [title]="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <span nz-icon [nzType]="collapsed ? 'menu-unfold' : 'menu-fold'" class="text-sm"></span>
      </button>

      <!-- Current Screen Title and Form ID -->
      <div class="flex items-center gap-2.5 flex-1 min-w-0">
        <h1 class="header-title m-0 tracking-tight truncate">
          {{ currentScreen?.title || 'OS Pharmacy PMS' }}
        </h1>
        @if (currentScreen?.form_id) {
          <span class="header-form-badge inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-medium shrink-0">
            {{ currentScreen?.form_id }}
          </span>
        }
      </div>

      <!-- Right Header Actions -->
      <div class="flex items-center gap-2.5">
        <!-- Quick Action Shortcut Buttons (Form Permission Based) -->
        <div class="flex items-center gap-1.5">
          @if (canAccessSalePos) {
            <a
              routerLink="/customer/sale"
              class="header-quick-action-btn"
              [class.header-quick-action-btn-active]="isSalePosActive"
              nz-tooltip
              nzTooltipTitle="Sale POS Terminal (SALE_1401)"
            >
              <span nz-icon nzType="shopping-cart" class="btn-icon-sale"></span>
              <span>Sale POS</span>
            </a>
          }

          @if (canAccessPurPos) {
            <a
              routerLink="/supplier/purchase"
              class="header-quick-action-btn"
              [class.header-quick-action-btn-active]="isPurPosActive"
              nz-tooltip
              nzTooltipTitle="Purchase POS / Invoice Entry (PUR_1503)"
            >
              <span nz-icon nzType="shop" class="btn-icon-pur"></span>
              <span>Pur POS</span>
            </a>
          }

          @if (canAccessCashCloser) {
            <button
              type="button"
              (click)="navigateToCashCloser()"
              class="header-quick-action-btn"
              [class.header-quick-action-btn-active]="isCashCloserActive"
              nz-tooltip
              nzTooltipTitle="Cash Closer & Shift Handover (CASH_1201)"
            >
              <span nz-icon nzType="calculator" class="btn-icon-closer"></span>
              <span>Cash Closer</span>
            </button>
          }
        </div>

        <div class="h-4 w-px bg-white/15 mx-0.5 hidden sm:block"></div>

        <!-- Active Branch Indicator -->
        <div class="header-branch-pill hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="text-xs font-medium truncate max-w-[150px]">
            {{ authService.activeBranch()?.name || 'Cumilla Branch' }}
          </span>
        </div>

        <!-- Notification Bell -->
        <button
          type="button"
          class="header-icon-btn w-8 h-8 rounded-lg flex items-center justify-center relative"
        >
          <span nz-icon nzType="bell" class="text-sm"></span>
          <span class="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
        </button>

        <!-- User Dropdown Menu -->
        <div
          nz-dropdown
          [nzDropdownMenu]="userMenu"
          nzPlacement="bottomRight"
          class="header-user-btn flex items-center gap-2 rounded-lg px-2.5 py-1 cursor-pointer select-none"
        >
          <div class="w-7 h-7 rounded-full theme-avatar-gradient flex items-center justify-center text-white text-xs font-bold shadow-xs border border-white/10">
            {{ (authService.currentUser()?.first_name || 'A').charAt(0).toUpperCase() }}
          </div>
          <div class="hidden md:block text-left">
            <p class="header-user-title m-0">
              {{ authService.currentUser()?.first_name || 'Admin' }}
            </p>
            <p class="header-user-sub m-0">PMS Manager</p>
          </div>
          <span nz-icon nzType="down" class="header-user-chevron text-slate-400"></span>
        </div>

        <nz-dropdown-menu #userMenu="nzDropdownMenu">
          <ul nz-menu class="w-52 shadow-xl rounded-xl p-1.5 border border-slate-200 bg-white">
            <li class="px-3 py-2 border-b border-slate-100 mb-1 cursor-default">
              <p class="text-xs font-semibold text-slate-800 m-0 leading-tight">
                {{ authService.currentUser()?.first_name || 'Admin User' }}
              </p>
              <p class="text-[11px] text-slate-400 m-0 leading-tight mt-0.5 truncate">
                {{ authService.currentUser()?.email || 'admin@aidly.com' }}
              </p>
            </li>
            <li nz-menu-item routerLink="/change-pharmacy">
              <span nz-icon nzType="swap"></span>
              <span>Switch Branch</span>
            </li>
            <li nz-menu-item routerLink="/settings/sale-config">
              <span nz-icon nzType="setting"></span>
              <span>System Settings</span>
            </li>
            <li nz-menu-divider></li>
            <li
              nz-menu-item
              tabindex="0"
              (click)="logout()"
              (keydown.enter)="logout()"
              class="logout-item"
            >
              <span nz-icon nzType="logout"></span>
              <span>Sign Out</span>
            </li>
          </ul>
        </nz-dropdown-menu>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  @Input() collapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  currentScreen?: SystemScreen;
  currentUrl = '';

  constructor() {
    this.currentUrl = this.router.url;
    this.updateScreen(this.router.url);
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(event => {
        const url = (event as NavigationEnd).urlAfterRedirects || (event as NavigationEnd).url;
        this.currentUrl = url;
        this.updateScreen(url);
      });
  }

  // Permission Checks:
  // Form permission-based checking as requested:
  // "f this form permission has then this button will visibled"
  get canAccessSalePos(): boolean {
    return this.hasFormPermission('SALE_1401', 'PMS-Sale-Module');
  }

  get canAccessPurPos(): boolean {
    return this.hasFormPermission('PUR_1503', 'PMS-Vendor-Module');
  }

  get canAccessCashCloser(): boolean {
    return this.hasFormPermission('CASH_1201', 'PMS-Sale-Module');
  }

  private hasFormPermission(formId: string, fallbackModulePerm: string): boolean {
    const screen = getScreenByFormId(formId);
    const perm = screen?.permission_code || fallbackModulePerm;
    return this.authService.hasPermission(perm) || this.authService.hasPermission(formId);
  }

  get isSalePosActive(): boolean {
    return this.currentUrl.startsWith('/customer/sale');
  }

  get isPurPosActive(): boolean {
    return this.currentUrl.startsWith('/supplier/purchase');
  }

  get isCashCloserActive(): boolean {
    return this.currentUrl.startsWith('/cash/receive');
  }

  navigateToCashCloser(): void {
    this.router.navigate(['/cash/receive'], {
      queryParams: { action: 'closer', _t: Date.now() },
    });
  }

  private updateScreen(url: string): void {
    this.currentScreen = getScreenByRoute(url);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}

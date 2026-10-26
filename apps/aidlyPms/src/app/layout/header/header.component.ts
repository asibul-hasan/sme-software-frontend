import { Component, EventEmitter, Input, Output, inject, signal, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ApiService } from '../../core/services/api.service';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { AuthService } from '../../core/auth/auth.service';
import { BackendDiscoveryService } from '../../core/services/backend-discovery.service';
import { ConnectivityService } from '../../core/services/connectivity.service';
import { SyncService } from '../../core/services/sync.service';
import { CatalogRefreshService } from '../../core/services/catalog-refresh.service';
import { OfflineSalesDrawerComponent } from './offline-sales-drawer.component';
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
    OfflineSalesDrawerComponent,
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
    .header-backend-pill {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #e2e8f0;
      transition: all 0.2s ease;
    }
    .header-backend-pill:hover {
      filter: brightness(1.2);
    }
    .backend-local {
      background: rgba(16, 185, 129, 0.12) !important;
      border-color: rgba(16, 185, 129, 0.35) !important;
    }
    .backend-remote {
      background: rgba(14, 165, 233, 0.12) !important;
      border-color: rgba(14, 165, 233, 0.35) !important;
    }
    .backend-checking {
      background: rgba(245, 158, 11, 0.12) !important;
      border-color: rgba(245, 158, 11, 0.35) !important;
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
        [attr.aria-label]="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
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
             aria-label="Sale POS Terminal (SALE_1401)">
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
             aria-label="Purchase POS / Invoice Entry (PUR_1503)">
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
             aria-label="Cash Closer & Shift Handover (CASH_1201)">
              <span nz-icon nzType="calculator" class="btn-icon-closer"></span>
              <span>Cash Closer</span>
            </button>
          }
        </div>

        <div class="h-4 w-px bg-white/15 mx-0.5 hidden sm:block"></div>

        <!-- Backend Connection Indicator Pill (Localhost vs Hugging Face Live) -->
        <button
          type="button"
          (click)="discovery.recheckNow()"
          class="header-backend-pill flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-pointer select-none text-xs font-mono"
          [class.backend-local]="discovery.mode() === 'local' && discovery.status() === 'connected'"
          [class.backend-remote]="discovery.mode() === 'remote' && discovery.status() === 'connected'"
          [class.backend-checking]="discovery.status() === 'checking'"
          nz-tooltip
          [nzTooltipTitle]="backendTooltip"
          aria-label="Recheck backend connection status"
        >
          @if (discovery.status() === 'checking') {
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-spin"></span>
            <span class="text-amber-300 font-medium">Checking...</span>
          } @else if (discovery.mode() === 'local') {
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-emerald-300 font-medium">Local:{{ discovery.activePort() || 5275 }}</span>
            @if (discovery.latencyMs() !== null) {
              <span class="text-emerald-400/70 text-[10px]">({{ discovery.latencyMs() }}ms)</span>
            }
          } @else {
            <span class="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            <span class="text-sky-300 font-medium">HF Live</span>
            @if (discovery.latencyMs() !== null) {
              <span class="text-sky-400/70 text-[10px]">({{ discovery.latencyMs() }}ms)</span>
            }
          }
        </button>

        <!-- Offline POS / Sync Status Chip -->
        <button
          type="button"
          (click)="drawerVisible.set(true)"
          class="header-backend-pill flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer border select-none transition-all"
          [class.bg-emerald-500/10]="connectivity.isOnline() && syncService.failedCount() === 0 && !syncService.isSyncing()"
          [class.border-emerald-500/30]="connectivity.isOnline() && syncService.failedCount() === 0 && !syncService.isSyncing()"
          [class.bg-rose-500/15]="!connectivity.isOnline() || syncService.failedCount() > 0"
          [class.border-rose-500/40]="!connectivity.isOnline() || syncService.failedCount() > 0"
          [class.bg-indigo-500/15]="connectivity.isOnline() && syncService.isSyncing()"
          [class.border-indigo-500/40]="connectivity.isOnline() && syncService.isSyncing()"
          nz-tooltip
          [nzTooltipTitle]="offlineTooltip"
          aria-label="View offline queue and sync status"
        >
          @if (syncService.isSyncing()) {
            <span nz-icon nzType="loading" class="text-indigo-400"></span>
            <span class="text-indigo-300">Syncing ({{ syncService.pendingCount() }})</span>
          } @else if (syncService.failedCount() > 0) {
            <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span class="text-rose-300">Sync Error ({{ syncService.failedCount() }})</span>
          } @else if (!connectivity.isOnline()) {
            <span class="w-2 h-2 rounded-full bg-rose-500"></span>
            <span class="text-rose-300 font-bold">Offline {{ syncService.pendingCount() > 0 ? '(' + syncService.pendingCount() + ')' : '' }}</span>
          } @else if (syncService.pendingCount() > 0) {
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span class="text-amber-300">Pending ({{ syncService.pendingCount() }})</span>
          } @else {
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span class="text-emerald-300">Online</span>
          }
        </button>

        <!-- Active Branch Indicator & Switcher Dropdown -->
        <div
          nz-dropdown
          [nzDropdownMenu]="branchMenu"
          nzPlacement="bottomRight"
          class="header-branch-pill hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full cursor-pointer select-none hover:bg-white/10 transition-colors"
          role="button"
          tabindex="0"
          aria-label="Switch active pharmacy branch"
          nz-tooltip
          nzTooltipTitle="Click to switch active pharmacy branch"
        >
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="text-xs font-medium truncate max-w-[150px]">
            {{ authService.activeBranch()?.name || 'Cumilla Branch' }}
          </span>
          <span nz-icon nzType="down" class="text-[10px] text-slate-400"></span>
        </div>

        <nz-dropdown-menu #branchMenu="nzDropdownMenu">
          <ul nz-menu class="w-56 shadow-xl rounded-xl p-1.5 border border-slate-200 bg-white">
            <li class="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Switch Branch
            </li>
            @for (b of availableBranches(); track b.branch_no) {
              <li
                nz-menu-item
                (click)="switchBranch(b)"
                [class.font-bold]="b.branch_no === authService.activeBranch()?.branch_no"
                class="flex items-center justify-between text-xs py-2"
              >
                <span class="truncate">{{ b.name }}</span>
                @if (b.branch_no === authService.activeBranch()?.branch_no) {
                  <span class="text-emerald-600 text-xs font-semibold ml-2">✓ Active</span>
                }
              </li>
            }
            <li nz-menu-divider></li>
            <li nz-menu-item routerLink="/change-pharmacy" class="text-xs text-indigo-600 font-medium">
              <span nz-icon nzType="swap"></span>
              <span>All Branches</span>
            </li>
          </ul>
        </nz-dropdown-menu>

        <!-- Notification Bell -->
        <button
          type="button"
          class="header-icon-btn w-8 h-8 rounded-lg flex items-center justify-center relative"
          aria-label="View notifications"
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
          role="button"
          tabindex="0"
          aria-label="User account menu"
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

      <app-offline-sales-drawer
        [visible]="drawerVisible()"
        (close)="drawerVisible.set(false)"
      ></app-offline-sales-drawer>
    </header>
  `,
})
export class HeaderComponent implements OnInit {
  readonly api = inject(ApiService);
  readonly msg = inject(NzMessageService);
  readonly availableBranches = signal<any[]>([]);
  readonly connectivity = inject(ConnectivityService);
  readonly syncService = inject(SyncService);
  readonly catalogRefresh = inject(CatalogRefreshService);
  readonly drawerVisible = signal<boolean>(false);

  get offlineTooltip(): string {
    const online = this.connectivity.isOnline();
    const pending = this.syncService.pendingCount();
    const failed = this.syncService.failedCount();
    const catText = this.catalogRefresh.lastUpdateText();
    if (!online) {
      return `Offline mode active. Sales will queue locally (${pending} queued). ${catText}. Click to view queue.`;
    }
    if (failed > 0) {
      return `${failed} sale(s) failed sync! Click to retry or inspect. ${catText}.`;
    }
    if (pending > 0) {
      return `${pending} sale(s) pending sync. ${catText}. Click to view queue.`;
    }
    return `System online. ${catText}. Click to manage offline sync.`;
  }

  ngOnInit(): void {
    this.loadBranches();
  }

  loadBranches(): void {
    this.api.get<any[]>('sys/branches').subscribe({
      next: res => {
        if (res.data && Array.isArray(res.data)) {
          this.availableBranches.set(res.data);
        }
      }
    });
  }

  switchBranch(branch: any): void {
    if (branch.branch_no === this.authService.activeBranch()?.branch_no) return;
    this.api.post<any>('sys/switch-branch', { branch_no: branch.branch_no }).subscribe({
      next: (res) => {
        if (res?.data?.branch) {
          this.authService.switchBranch(res.data.branch, res.data.token);
        }
        this.msg.success(`Switched active branch to "${branch.name}"`);
        setTimeout(() => {
          window.location.reload();
        }, 300);
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to switch branch');
      }
    });
  }
  @Input() collapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  readonly authService = inject(AuthService);
  readonly discovery = inject(BackendDiscoveryService);
  private readonly router = inject(Router);

  currentScreen?: SystemScreen;
  currentUrl = '';

  get backendTooltip(): string {
    const origin = this.discovery.currentOrigin();
    const mode = this.discovery.mode();
    const latency = this.discovery.latencyMs();
    const latencyStr = latency !== null ? ` (${latency}ms)` : '';
    if (mode === 'local') {
      return `Connected to Localhost backend at ${origin}${latencyStr}. Auto-failover to Hugging Face enabled. Click to re-check.`;
    }
    return `Connected to Hugging Face Cloud Live at ${origin}${latencyStr}. Polling for localhost to reconnect automatically. Click to probe local now.`;
  }

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
    return this.authService.hasMenuAccess('SALE_1401', 'view');
  }

  get canAccessPurPos(): boolean {
    return this.authService.hasMenuAccess('PUR_1503', 'view');
  }

  get canAccessCashCloser(): boolean {
    return this.authService.hasMenuAccess('CASH_1201', 'view');
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

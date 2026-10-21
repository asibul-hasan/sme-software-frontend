import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/auth/auth.service';

interface BranchItem {
  id: number;
  name: string;
  address: string;
  active: boolean;
}

@Component({
  selector: 'app-branch-switcher',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzButtonModule,
    NzIconModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="max-w-2xl space-y-4">
      <app-page-header
        title="Multi-Branch Pharmacy Switcher"
        subtitle="Switch your active retail terminal between registered pharmacy outlet branches"
        formId="PHAR_2201"
        [breadcrumbs]="[{ label: 'System', url: '/dashboard' }, { label: 'Change Pharmacy' }]"
      >
        <div actions class="flex items-center gap-2">
          <button nz-button nzDanger nzType="default" (click)="logout()" class="rounded-md">
            <span nz-icon nzType="logout"></span> Logout Session
          </button>
        </div>
      </app-page-header>

      <div class="space-y-3">
        @for (b of branches(); track b.id) {
          <div
            class="p-4 border-2 rounded-xl flex items-center justify-between transition-all"
            [ngClass]="b.active ? 'theme-highlight-card shadow-xs' : 'border-slate-200 bg-white hover:border-slate-300'"
          >
            <div class="flex items-center gap-3.5">
              <div
                class="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                [ngClass]="b.active ? 'theme-pill-active' : 'bg-slate-100 text-slate-500'"
              >
                🏪
              </div>
              <div>
                <p class="font-bold text-slate-900 mb-0.5">{{ b.name }}</p>
                <p class="text-xs text-slate-500 mb-0">{{ b.address }}</p>
              </div>
            </div>

            <div>
              @if (b.active) {
                <span class="px-3 py-1 theme-pill-active text-xs font-bold rounded-full inline-flex items-center gap-1">
                  ✓ Active Branch
                </span>
              } @else {
                <button
                  type="button"
                  nz-button
                  nzType="default"
                  (click)="switchBranch(b)"
                  class="rounded-md"
                >
                  Switch to Branch
                </button>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class BranchSwitcherComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly authService = inject(AuthService);

  branches = signal<BranchItem[]>([]);

  ngOnInit(): void {
    const currentBranch = this.authService.activeBranch();
    this.api.get<any[]>('sys/branches').subscribe({
      next: res => {
        if (res.data && res.data.length > 0) {
          this.branches.set(res.data.map(b => ({
            id: b.branch_no,
            name: b.name,
            address: [b.address, b.district, b.postal_code].filter(Boolean).join(', '),
            active: currentBranch ? b.branch_no === currentBranch.branch_no : false
          })));
        }
      }
    });
  }

  switchBranch(target: BranchItem): void {
    this.api.post<any>('sys/switch-branch', { branch_no: target.id }).subscribe({
      next: (res) => {
        if (res?.data?.branch) {
          this.authService.switchBranch(res.data.branch, res.data.token);
        }
        this.branches.update(list =>
          list.map(b => ({ ...b, active: b.id === target.id }))
        );
        this.msg.success(`Switched active pharmacy branch to "${target.name}"!`);
      },
      error: (err) => {
        this.msg.error(err?.error?.message || `Failed to switch branch`);
      }
    });
  }

  logout(): void {
    this.msg.info('Logging out of Aidly PMS...');
    this.router.navigate(['/']);
  }
}

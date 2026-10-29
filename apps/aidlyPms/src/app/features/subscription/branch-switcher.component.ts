import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
    FormsModule,
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

      @if (isPlatformOwner()) {
        <form class="rounded-xl border border-slate-200 bg-white p-4 space-y-3" (ngSubmit)="provision()">
          <h2 class="text-base font-semibold">Client setup</h2>
          <label class="block text-sm">Create
            <select name="kind" [(ngModel)]="setup.kind" class="block w-full border rounded p-2">
              <option value="company">Company with main branch</option>
              <option value="branch">Branch in an existing company</option>
            </select>
          </label>
          @if (setup.kind === 'branch') {
            <label class="block text-sm">Company
              <select name="pharmacy" [(ngModel)]="setup.pharmacy_no" required class="block w-full border rounded p-2">
                <option [ngValue]="0" disabled>Select company</option>
                @for (company of companies(); track company.pharmacy_no) {
                  <option [ngValue]="company.pharmacy_no">{{ company.name }}</option>
                }
              </select>
            </label>
          }
          <label class="block text-sm">Name <input name="name" [(ngModel)]="setup.name" required maxlength="200" class="block w-full border rounded p-2" /></label>
          <label class="block text-sm">Contact phone <input name="phone" [(ngModel)]="setup.contact_phone" required maxlength="20" class="block w-full border rounded p-2" /></label>
          <label class="block text-sm">Address <input name="address" [(ngModel)]="setup.address" required class="block w-full border rounded p-2" /></label>
          <label class="block text-sm">District <input name="district" [(ngModel)]="setup.district" required maxlength="100" class="block w-full border rounded p-2" /></label>
          <button nz-button nzType="primary" [disabled]="provisioning() || !setup.name.trim() || !setup.contact_phone.trim() || !setup.address.trim() || !setup.district.trim() || (setup.kind === 'branch' && !setup.pharmacy_no)">Create {{ setup.kind }}</button>
        </form>
      }
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

  readonly isPlatformOwner = () => !!this.authService.currentUser()?.is_platform_owner;
  readonly provisioning = signal(false);
  readonly companies = signal<{ pharmacy_no: number; name: string }[]>([]);
  setup = { kind: 'company', pharmacy_no: 0, name: '', contact_phone: '', address: '', district: '' };
  branches = signal<BranchItem[]>([]);

  ngOnInit(): void {
    if (this.isPlatformOwner()) this.api.get<{ pharmacy_no: number; name: string }[]>('sys/pharmacies').subscribe({ next: res => this.companies.set(res.data || []) });
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
        setTimeout(() => {
          this.router.navigate(['/dashboard']).then(() => window.location.reload());
        }, 300);
      },
      error: (err) => {
        this.msg.error(err?.error?.message || `Failed to switch branch`);
      }
    });
  }

  provision(): void {
    this.provisioning.set(true);
    this.api.post(this.setup.kind === 'company' ? 'sys/pharmacies' : 'sys/branches', this.setup).subscribe({
      next: () => { this.provisioning.set(false); this.msg.success('Client setup created. You can now switch to its branch.'); this.ngOnInit(); },
      error: () => this.provisioning.set(false),
    });
  }

  logout(): void {
    this.authService.logout();
    this.msg.info('Logging out of Aidly PMS...');
    this.router.navigate(['/']);
  }
}

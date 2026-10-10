import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, NzInputModule, NzButtonModule, NzIconModule],
  template: `
    <div class="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      <!-- Background subtle gradient decor -->
      <div class="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Main Login Card -->
      <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-10 transition-all">
        <!-- Brand Header -->
        <div class="p-8 pb-6 text-center border-b border-slate-100 bg-slate-50/50">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 mb-3">
            <span nz-icon nzType="medicine-box" nzTheme="outline" class="text-2xl"></span>
          </div>
          <h1 class="text-2xl font-bold text-slate-800 tracking-tight mb-1">Aidly PMS</h1>
          <p class="text-xs text-slate-500 font-medium">Pharmacy Management & Point of Sale</p>
        </div>

        <!-- Form Body -->
        <div class="p-8 pt-6 space-y-5">
          @if (errorMessage()) {
            <div class="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5">
              <span nz-icon nzType="close-circle" class="text-rose-500 text-base mt-0.5 flex-shrink-0"></span>
              <div class="font-medium">{{ errorMessage() }}</div>
            </div>
          }

          <form (ngSubmit)="onLogin()" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">
                Phone Number / Username
              </label>
              <div class="relative">
                <input
                  type="text"
                  nz-input
                  [(ngModel)]="phone"
                  name="phone"
                  required
                  placeholder="e.g. 01700000000"
                  class="rounded-lg py-2 text-sm font-medium"
                  [disabled]="loading()"
                />
              </div>
            </div>

            <div>
              <div class="flex justify-between items-center mb-1.5">
                <label class="block text-xs font-semibold text-slate-700">
                  Password
                </label>
              </div>
              <div class="relative">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  nz-input
                  [(ngModel)]="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  class="rounded-lg py-2 text-sm pr-10"
                  [disabled]="loading()"
                />
                <button
                  type="button"
                  (click)="showPassword.set(!showPassword())"
                  class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                >
                  <span nz-icon [nzType]="showPassword() ? 'eye-invisible' : 'eye'"></span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              nz-button
              nzType="primary"
              [nzLoading]="loading()"
              class="w-full h-11 rounded-lg text-sm font-semibold tracking-wide shadow-md shadow-emerald-600/20 transition-all mt-2"
            >
              Sign In to Pharmacy
            </button>
          </form>

          <!-- Quick Test Credentials -->
          <div class="pt-4 border-t border-slate-100">
            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">
              Quick Demo Access
            </p>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                (click)="fillDemo('01700000000', 'password123')"
                class="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-colors cursor-pointer group"
              >
                <div class="text-xs font-semibold text-slate-700 group-hover:text-emerald-700">Admin Manager</div>
                <div class="text-[10px] text-slate-400 font-mono">01700000000</div>
              </button>

              <button
                type="button"
                (click)="fillDemo('01700000001', 'password123')"
                class="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-colors cursor-pointer group"
              >
                <div class="text-xs font-semibold text-slate-700 group-hover:text-emerald-700">POS Salesman</div>
                <div class="text-[10px] text-slate-400 font-mono">01700000001</div>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <p class="text-[11px] text-slate-400 mb-0">
            Secure multi-tenant pharmacy workspace &middot; Aidly PMS v2.4
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly msg = inject(NzMessageService);

  phone = '';
  password = '';
  readonly showPassword = signal(false);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.redirectAfterLogin();
    }
  }

  fillDemo(demoPhone: string, demoPass: string): void {
    this.phone = demoPhone;
    this.password = demoPass;
    this.errorMessage.set(null);
  }

  onLogin(): void {
    if (!this.phone.trim() || !this.password.trim()) {
      this.errorMessage.set('Please enter your phone number and password.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.phone.trim(), this.password.trim()).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.msg.success(res.message || 'Login successful!');
          this.redirectAfterLogin();
        } else {
          this.errorMessage.set(res.message || 'Invalid credentials.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        const serverMsg = err?.error?.message || err?.error?.errors?.[0] || 'Unable to sign in. Please verify your phone number and password.';
        this.errorMessage.set(serverMsg);
      },
    });
  }

  private redirectAfterLogin(): void {
    if (this.authService.isManager()) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/customer/sale']);
    }
  }
}

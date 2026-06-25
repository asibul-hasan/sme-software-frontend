import { Component, ChangeDetectionStrategy, DestroyRef, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../core';
import { ToastrService } from 'ngx-toastr';
import { StorageService } from '../../../core/services/storage.service';
import { globalConstants } from '../../../core/constants/global.constants';
import {
  AuthDataService,
  Company,
  Branch,
  UserContextResponse,
} from '../services/data.service';
import { catchError, interval, of, takeWhile } from 'rxjs';

import { NgSelectModule } from '@ng-select/ng-select';
import { MatIconModule } from '@angular/material/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    NgSelectModule,
    MatIconModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  showPassword = false;
  private readonly fb              = inject(FormBuilder);
  private readonly authService     = inject(AuthService);
  private readonly authDataService = inject(AuthDataService);
  private readonly router          = inject(Router);
  private readonly route           = inject(ActivatedRoute);
  private readonly toastr          = inject(ToastrService);
  private readonly storage         = inject(StorageService);
  private readonly destroyRef      = inject(DestroyRef);
  private readonly cdr             = inject(ChangeDetectorRef);
  private readonly authStorageScope = globalConstants.authStorageScope;

  contexts:  UserContextResponse[] = [];
  companies: Company[] = [];
  branches:  Branch[] = [];
  lockedUntil: string | null = null;
  lockedRemainingSeconds = 0;
  private returnUrl = '/dashboard';
  currentYear = new Date().getFullYear();

  loginForm: FormGroup = this.fb.group({
    userName: ['', Validators.required],
    company_no: [{ value: null, disabled: true }, Validators.required],
    branch_no: [null, Validators.required],
    password: ['', Validators.required],
  });

  isLoading = signal(false);
  isLoadingMetadata = signal(false);

  ngOnInit() {
    this.returnUrl =
      this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    // Pre-fill the last user id for this auth session, then load its contexts.
    const lastUserId = this.storage.getItem<string>(globalConstants.storageKeys.lastUserId, this.authStorageScope);
    if (lastUserId) {
      this.loginForm.get('userName')?.setValue(lastUserId);
      this.onUserNameBlur();
    }
  }

  onUserNameBlur() {
    const userName = this.loginForm.get('userName')?.value;
    if (userName) {
      this.isLoadingMetadata.set(true);
      this.loginForm.get('company_no')?.setValue(null);
      this.loginForm.get('company_no')?.disable();
      this.loginForm.get('branch_no')?.setValue(null);
      this.contexts = [];
      this.companies = [];
      this.branches = [];

      this.authDataService
        .getUserContexts(userName)
        .pipe(
          catchError(() => of([])),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((contexts: UserContextResponse[]) => {
          // Defer state updates to next tick to avoid NG0100 in Angular 21
          setTimeout(() => {
            this.contexts = contexts;

            if (this.contexts && this.contexts.length > 0) {
              this.companies = this.contexts.map((c) => ({
                company_no: c.company_no,
                company_name: c.company_name,
              }));

              this.loginForm.get('company_no')?.setValue(this.preferredCompanyNo());
              this.loginForm.get('company_no')?.enable();

              this.onCompanyChange();
            }
            
            this.isLoadingMetadata.set(false);
            this.cdr.detectChanges();
          });
        });
    }
  }

  onCompanyChange() {
    const companyNo = Number(this.loginForm.get('company_no')?.value);
    const context = this.contexts.find((c) => c.company_no === companyNo);

    if (context) {
      this.branches = context.branches.map((b: Branch) => ({
        branch_no: b.branch_no,
        branch_name: b.branch_name,
      }));

      // Auto-select when there is a remembered branch or only one option (re-plan hybrid login).
      this.loginForm.get('branch_no')?.setValue(this.preferredBranchNo());
    } else {
      this.branches = [];
      this.loginForm.get('branch_no')?.setValue(null);
    }
    this.cdr.markForCheck();
  }

  /** Last-used company for this auth session (if the typed user matches), else the first company. */
  private preferredCompanyNo(): number {
    const first = this.companies[0].company_no;
    const typed = this.loginForm.get('userName')?.value;
    const lastUserId = this.storage.getItem<string>(globalConstants.storageKeys.lastUserId, this.authStorageScope);
    if (typed && typed === lastUserId) {
      const lastCompany = Number(this.storage.getItem<number>(globalConstants.storageKeys.lastCompanyNo, this.authStorageScope));
      if (lastCompany && this.companies.some((c) => c.company_no === lastCompany)) return lastCompany;
    }
    return first;
  }

  /** Remembered branch (if the typed user matches) → else the single branch → else none. */
  private preferredBranchNo(): number | null {
    const typed = this.loginForm.get('userName')?.value;
    const lastUserId = this.storage.getItem<string>(globalConstants.storageKeys.lastUserId, this.authStorageScope);
    if (typed && typed === lastUserId) {
      const lastBranch = Number(this.storage.getItem<number>(globalConstants.storageKeys.lastBranchNo, this.authStorageScope));
      if (lastBranch && this.branches.some((b) => b.branch_no === lastBranch)) return lastBranch;
    }
    return this.branches.length === 1 ? this.branches[0].branch_no : null;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.lockedUntil = null;

      const formValue = this.loginForm.getRawValue();
      const payload = {
        user_id: formValue.userName,
        password: formValue.password,
        company_no: Number(formValue.company_no),
        branch_no: Number(formValue.branch_no),
      };

      this.authService.login(payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            // Use setTimeout to ensure the view state is stable before navigation and toastr
            setTimeout(() => {
              this.isLoading.set(false);
              // Save the current branches list to context so Header can show them
              this.authService.setAvailableBranches(this.branches);

              if (response?.must_change_password === 1) {
                this.toastr.warning('You must change your password before continuing.', 'Action Required');
              } else {
                this.toastr.success('Logged in successfully', 'Welcome');
              }
              this.router.navigateByUrl(this.returnUrl);
              this.cdr.detectChanges();
            });
          },
          error: (err: { error?: { locked_until?: string; message?: string } }) => {
            setTimeout(() => {
              this.isLoading.set(false);
              if (err.error?.locked_until) {
                this.lockedUntil = err.error.locked_until;
                this.startLockTimer();
              } else {
                this.toastr.error(this.mapLoginError(err.error?.message), 'Login Failed');
              }
              this.cdr.detectChanges();
            });
          },
        });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  /** Maps backend login error codes to user-friendly messages. */
  private mapLoginError(code?: string): string {
    switch (code) {
      case 'PASSWORD_NOT_SET':        return 'Your password has not been set yet. Please contact your administrator.';
      case 'INVALID_CREDENTIALS':     return 'Invalid user ID or password.';
      case 'USER_LOCKED':             return 'Your account is locked. Please contact your administrator.';
      case 'USER_INACTIVE':           return 'Your account is inactive. Please contact your administrator.';
      case 'TOO_MANY_LOGIN_ATTEMPTS': return 'Too many failed attempts. Please try again in a few minutes.';
      case 'BRANCH_ACCESS_DENIED':    return 'You do not have access to the selected branch.';
      case 'COMPANY_ACCESS_DENIED':   return 'You do not have access to the selected company.';
      default:                        return code || 'Invalid credentials';
    }
  }

  startLockTimer() {
    if (!this.lockedUntil) return;
    const lockedAt = new Date(this.lockedUntil).getTime();

    interval(1000)
      .pipe(
        takeWhile(() => Date.now() < lockedAt),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.lockedRemainingSeconds = Math.floor((lockedAt - Date.now()) / 1000);
          this.cdr.markForCheck();
        },
        complete: () => {
          this.lockedRemainingSeconds = 0;
          this.lockedUntil = null;
          this.cdr.markForCheck();
        },
      });
  }
}


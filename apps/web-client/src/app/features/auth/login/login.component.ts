import { Component, DestroyRef, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
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
  private readonly destroyRef      = inject(DestroyRef);
  private readonly cdr             = inject(ChangeDetectorRef);

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

              const firstCompany = this.companies[0].company_no;
              this.loginForm.get('company_no')?.setValue(firstCompany);
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

      // We don't auto-select the branch anymore, user must select it
      this.loginForm.get('branch_no')?.setValue(null);
    } else {
      this.branches = [];
      this.loginForm.get('branch_no')?.setValue(null);
    }
    this.cdr.markForCheck();
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.lockedUntil = null;

      const formValue = this.loginForm.getRawValue();
      const payload = {
        user_name: formValue.userName,
        password: formValue.password,
        company_no: Number(formValue.company_no),
        branch_no: Number(formValue.branch_no),
      };

      this.authService.login(payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            // Use setTimeout to ensure the view state is stable before navigation and toastr
            setTimeout(() => {
              this.isLoading.set(false);
              // Save the current branches list to context so Header can show them
              this.authService.setAvailableBranches(this.branches);
              
              this.toastr.success('Logged in successfully', 'Welcome');
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
                this.toastr.error(err.error?.message || 'Invalid credentials', 'Login Failed');
              }
              this.cdr.detectChanges();
            });
          },
        });
    } else {
      this.loginForm.markAllAsTouched();
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


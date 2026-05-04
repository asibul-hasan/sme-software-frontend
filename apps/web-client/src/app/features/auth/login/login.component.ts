import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../core';
import { AlertService } from '../../../core/services/alert.service';
import { ToastrService } from 'ngx-toastr';
import {
  AuthDataService,
  Company,
  Branch,
  UserContextResponse,
} from '../services/data.service';
import { catchError, of } from 'rxjs';

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
export class LoginComponent implements OnInit, OnDestroy {
  showPassword = false;
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private authDataService = inject(AuthDataService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private alertService = inject(AlertService);
  private toastr = inject(ToastrService);

  contexts: UserContextResponse[] = [];
  companies: Company[] = [];
  branches: Branch[] = [];
  lockedUntil: string | null = null;
  lockedRemainingSeconds = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private returnUrl = '/dashboard';
  currentYear = new Date().getFullYear();

  loginForm: FormGroup = this.fb.group({
    userName: ['', Validators.required],
    company_no: [{ value: null, disabled: true }, Validators.required],
    branch_no: [null, Validators.required],
    password: ['', Validators.required],
  });

  isLoading = false;
  isLoadingMetadata = false;

  ngOnInit() {
    this.returnUrl =
      this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  onUserNameBlur() {
    const userName = this.loginForm.get('userName')?.value;
    if (userName) {
      this.isLoadingMetadata = true;
      this.loginForm.get('company_no')?.setValue(null);
      this.loginForm.get('company_no')?.disable();
      this.loginForm.get('branch_no')?.setValue(null);
      this.contexts = [];
      this.companies = [];
      this.branches = [];

      this.authDataService
        .getUserContexts(userName)
        .pipe(catchError(() => of([])))
        .subscribe((contexts: UserContextResponse[]) => {
          this.isLoadingMetadata = false;
          this.contexts = contexts;

          if (this.contexts && this.contexts.length > 0) {
            this.companies = this.contexts.map((c) => ({
              id: c.company_no,
              company_no: c.company_no,
              companyName: c.company_name,
            }));

            const firstCompany =
              this.companies[0].company_no || this.companies[0].id;
            this.loginForm.get('company_no')?.setValue(firstCompany);
            this.loginForm.get('company_no')?.enable();

            this.onCompanyChange();
          }
        });
    }
  }

  onCompanyChange() {
    const companyNo = Number(this.loginForm.get('company_no')?.value);
    const context = this.contexts.find((c) => c.company_no === companyNo);

    if (context) {
      this.branches = context.branches.map((b) => ({
        id: b.branch_no,
        branch_no: b.branch_no,
        branchName: b.branch_name,
      }));

      // We don't auto-select the branch anymore, user must select it
      this.loginForm.get('branch_no')?.setValue(null);
    } else {
      this.branches = [];
      this.loginForm.get('branch_no')?.setValue(null);
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.lockedUntil = null;

      const formValue = this.loginForm.getRawValue();
      const payload = {
        user_name: formValue.userName,
        password: formValue.password,
        company_no: Number(formValue.company_no),
        branch_no: Number(formValue.branch_no),
      };

      this.authService.login(payload).subscribe({
        next: () => {
          this.isLoading = false;
          // Save the current branches list to context so Header can show them
          this.authService.setAvailableBranches(this.branches);

          console.log(this.returnUrl);
          this.toastr.success('Logged in successfully', 'Welcome');
          this.router.navigateByUrl(this.returnUrl);
        },
        error: (err: {
          error?: { locked_until?: string; message?: string };
        }) => {
          this.isLoading = false;

          if (err.error && err.error.locked_until) {
            this.lockedUntil = err.error.locked_until;
            this.startLockTimer();
          } else {
            this.toastr.error(
              err.error?.message || 'Invalid credentials',
              'Login Failed',
            );
          }
          console.error('Login error', err);
        },
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  startLockTimer() {
    if (this.timer) clearInterval(this.timer);
    const lockedDate = new Date(this.lockedUntil as string).getTime();

    this.timer = setInterval(() => {
      const now = new Date().getTime();
      const diff = lockedDate - now;
      if (diff <= 0) {
        if (this.timer) clearInterval(this.timer);
        this.lockedRemainingSeconds = 0;
        this.lockedUntil = null;
      } else {
        this.lockedRemainingSeconds = Math.floor(diff / 1000);
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}

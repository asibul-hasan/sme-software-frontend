import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core';
import { ToastrService } from 'ngx-toastr';
import { AuthDataService, Company, Branch, UserContextResponse } from '../services/data.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit, OnDestroy {
  showPassword = false;
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private authDataService = inject(AuthDataService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastr = inject(ToastrService);

  contexts: UserContextResponse[] = [];
  companies: Company[] = [];
  branches: Branch[] = [];
  lockedUntil: string | null = null;
  lockedRemainingSeconds = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private returnUrl = '/dashboard';

  loginForm: FormGroup = this.fb.group({
    userName: ['', Validators.required],
    company_no: [{ value: null, disabled: true }, Validators.required],
    branch_no: [null, Validators.required],
    password: ['', Validators.required]
  });

  isLoading = false;
  isLoadingMetadata = false;

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
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

      this.authDataService.getUserContexts(userName).pipe(
        catchError(() => of([]))
      ).subscribe((contexts: UserContextResponse[]) => {
        this.isLoadingMetadata = false;
        this.contexts = contexts;
        
        if (this.contexts && this.contexts.length > 0) {
          this.companies = this.contexts.map(c => ({
            id: c.companyNo,
            company_no: c.companyNo,
            companyName: c.companyName
          }));

          const firstCompany = this.companies[0].company_no || this.companies[0].id;
          this.loginForm.get('company_no')?.setValue(firstCompany);
          
          if (this.companies.length > 1) {
            this.loginForm.get('company_no')?.enable();
          }
          
          this.onCompanyChange();
        }
      });
    }
  }

  onCompanyChange() {
    const companyNo = Number(this.loginForm.get('company_no')?.value);
    const context = this.contexts.find(c => c.companyNo === companyNo);
    
    if (context) {
      this.branches = context.branches.map(b => ({
        id: b.branchNo,
        branch_no: b.branchNo,
        branchName: b.branchName
      }));

      if (this.branches && this.branches.length > 0) {
        this.loginForm.get('branch_no')?.setValue(this.branches[0].branch_no || this.branches[0].id);
      } else {
        this.loginForm.get('branch_no')?.setValue(null);
      }
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
        userName: formValue.userName,
        password: formValue.password,
        companyNo: formValue.company_no,
        branchNo: formValue.branch_no
      };
      
      this.authService.login(payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.toastr.success('Logged in successfully', 'Welcome');
          this.router.navigateByUrl(this.returnUrl);
        },
        error: (err: { error?: { locked_until?: string, message?: string } }) => {
          this.isLoading = false;
          
          if (err.error && err.error.locked_until) {
             this.lockedUntil = err.error.locked_until;
             this.startLockTimer();
          } else {
             this.toastr.error(err.error?.message || 'Invalid credentials', 'Login Failed');
          }
          console.error('Login error', err);
        }
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

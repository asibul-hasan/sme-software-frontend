import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core';
import { ToastrService } from 'ngx-toastr';
import { AuthDataService } from '../services/data.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnDestroy {
  showPassword = false;
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private authDataService = inject(AuthDataService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  companies: any[] = [];
  branches: any[] = [];
  lockedUntil: string | null = null;
  lockedRemainingSeconds: number = 0;
  private timer: any;

  loginForm: FormGroup = this.fb.group({
    userName: ['', Validators.required],
    company_no: [{ value: null, disabled: true }, Validators.required],
    branch_no: [null, Validators.required],
    password: ['', Validators.required]
  });

  isLoading = false;
  isLoadingMetadata = false;

  onUserNameBlur() {
    const userName = this.loginForm.get('userName')?.value;
    if (userName) {
      this.isLoadingMetadata = true;
      this.loginForm.get('company_no')?.setValue(null);
      this.loginForm.get('branch_no')?.setValue(null);
      this.companies = [];
      this.branches = [];

      this.authDataService.getCompaniesByUserName(userName).pipe(
        catchError(() => of([]))
      ).subscribe((companiesResponse: any) => {
        // Handle array or wrapped response
        this.companies = Array.isArray(companiesResponse) ? companiesResponse : (companiesResponse.data || []);
        if (this.companies && this.companies.length > 0) {
           this.loginForm.get('company_no')?.setValue(this.companies[0].company_no || this.companies[0].id);
        }
        
        this.authDataService.getBranchesByUserName(userName).pipe(
          catchError(() => of([]))
        ).subscribe((branchesResponse: any) => {
          this.branches = Array.isArray(branchesResponse) ? branchesResponse : (branchesResponse.data || []);
          this.isLoadingMetadata = false;
          if (this.branches && this.branches.length === 1) {
            this.loginForm.get('branch_no')?.setValue(this.branches[0].branch_no || this.branches[0].id);
          }
        });
      });
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
        company_no: formValue.company_no,
        branch_no: formValue.branch_no
      };
      
      this.authService.login(payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.toastr.success('Logged in successfully', 'Welcome');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
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
           clearInterval(this.timer);
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

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  currentStep = 1;
  showPassword = false;
  showConfirmPassword = false;
  
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  registerForm: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    companyName: ['', Validators.required],
    industry: ['', Validators.required],
    branches: ['1 branch'],
    address: ['', Validators.required],
    plan: ['Starter — ৳8,000/month'],
    source: ['Select…'],
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  isLoading = false;

  nextStep() {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      const val = this.registerForm.value;
      const formData = {
        companyName: val.companyName,
        companyShortName: val.companyName.substring(0, 10), // Deriving short name
        adminEmail: val.email,
        password: val.password,
        country: 'Bangladesh',
        baseCurrencyCode: 'BDT'
      };

      this.authService.registerCompany(formData as any).subscribe({
        next: () => {
          this.isLoading = false;
          this.nextStep(); // Go to success step (Step 3)
        },
        error: (err) => {
          this.isLoading = false;
          this.toastr.error('Registration failed. Please try again.', 'Error');
          console.error('Registration error', err);
        },
      });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}

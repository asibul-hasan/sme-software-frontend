import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-forgot',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './forgot.component.html'
})
export class ForgotComponent {
  currentStep = 1;
  emailDisplay = '';

  private fb = inject(FormBuilder);
  
  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    otp: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  showPassword = false;
  showConfirmPassword = false;

  nextStep(step: number) {
    this.currentStep = step;
  }

  fSend() {
    if (this.forgotForm.get('email')?.valid) {
      this.emailDisplay = this.forgotForm.get('email')?.value || '';
      this.nextStep(2);
    } else {
      this.forgotForm.get('email')?.markAsTouched();
    }
  }

  fVerify() {
    this.nextStep(3);
  }

  fReset() {
    if (this.forgotForm.get('password')?.valid) {
      this.nextStep(4);
    }
  }

  fBack(step: number) {
    this.nextStep(step);
  }

  onOtpInput(event: any, nextInputId: string, prevInputId: string) {
    const input = event.target;
    if (input.value && nextInputId) {
      document.getElementById(nextInputId)?.focus();
    }
  }

  onOtpKeydown(event: KeyboardEvent, currentInputId: string, prevInputId: string) {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Backspace' && !input.value && prevInputId) {
      document.getElementById(prevInputId)?.focus();
    }
  }
}

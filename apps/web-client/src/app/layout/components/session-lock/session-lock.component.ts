import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { AuthContextService } from '../../../core/services/auth-context.service';
import { AlertService } from '../../../core/services/alert.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-session-lock',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './session-lock.component.html',
  styleUrls: ['./session-lock.component.scss'],
})
export class SessionLockComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private authContext = inject(AuthContextService);
  private alertService = inject(AlertService);
  private toastr = inject(ToastrService);
  private dialogRef = inject(MatDialogRef<SessionLockComponent>);

  user = this.authContext.user;
  showPassword = signal(false);
  isLoading = signal(false);
  error = signal('');

  lockForm = this.fb.group({
    password: ['', [Validators.required]],
  });

  onSubmit() {
    if (this.lockForm.invalid) return;

    this.isLoading.set(true);
    this.error.set('');

    const user = this.user();
    if (!user) {
      this.onSwitchUser();
      return;
    }

    const payload = {
      user_name: user.user_name,
      password: this.lockForm.value.password!,
      company_no: user.company_no,
      branch_no: user.branch_no,
    };

    this.authService.login(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toastr.success('Session unlocked successfully');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = err.error?.message || 'Incorrect password';
        this.error.set(errorMsg);
        this.toastr.error(errorMsg);
        console.error('Unlock error:', err);
      },
    });
  }

  onSwitchUser() {
    this.dialogRef.close(false);
  }
}

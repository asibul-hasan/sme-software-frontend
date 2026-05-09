import { Injectable, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseEntity } from '../../../../../core/models/base-entity.model';

/**
 * Interface representing a User entity.
 * Based on the sys_user table in db.md.
 */
export interface IUser extends BaseEntity {
  user_no: number;
  employee_no: number;
  user_name: string;
  password?: string;
  last_login_at?: string | null;
  password_changed_at?: string | null;
  failed_login_count?: number | null;
  is_locked: number;
  active_status: number;
  remarks?: string | null;
  row_version?: number | null;
}

@Injectable()
export class Sys1101ModelService {
  private fb = inject(FormBuilder);

  isSaving = signal(false);
  isLoading = signal(false);
  users = signal<IUser[]>([]);
  selectedUser = signal<IUser | null>(null);

  form!: FormGroup;


  initForm(): void {
    this.form = this.fb.group({
      user_no: [null],
      employee_no: [null, [Validators.required]],
      user_name: ['', [Validators.required, Validators.maxLength(50)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      is_locked: [0, [Validators.required]],
      active_status: [1, [Validators.required]],
      remarks: [''],
    });
  }

  patchForm(data: IUser): void {
    if (this.form && data) {
      this.form.patchValue(data);
      // Password should probably not be patched back
      this.form.get('password')?.setValidators(null);
      this.form.get('password')?.updateValueAndValidity();
    }
  }
}

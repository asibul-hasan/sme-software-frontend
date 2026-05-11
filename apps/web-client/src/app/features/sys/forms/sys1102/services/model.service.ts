import { Injectable, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseEntity } from '../../../../../core/models/base-entity.model';

/**
 * Interface representing a Role entity.
 * Based on the sys_role table in db.md.
 */
export interface IRole extends BaseEntity {
  role_no: number;
  role_id: string;
  role_name: string;
  role_desc?: string | null;
  can_insert: number;
  can_update: number;
  can_view: number;
  can_delete: number;
  company_no: number;
  branch_no?: number | null;
  active_status: number;
  display_sl?: number | null;
  remarks?: string | null;
}

@Injectable()
export class Sys1102ModelService {
  private fb = inject(FormBuilder);

  isSaving = signal(false);
  isLoading = signal(false);
  roles = signal<IRole[]>([]);
  selectedRole = signal<IRole | null>(null);

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      role_no: [null],
      role_id: ['', [Validators.required, Validators.maxLength(50)]],
      role_name: ['', [Validators.required, Validators.maxLength(100)]],
      role_desc: [''],
      can_insert: [1],
      can_update: [1],
      can_view: [1],
      can_delete: [1],
      company_no: [null, [Validators.required]],
      branch_no: [null],
      active_status: [1, [Validators.required]],
      display_sl: [null],
      remarks: [''],
    });
  }

  patchForm(data: IRole): void {
    if (this.form && data) {
      this.form.patchValue(data);
    }
  }
}

import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { Hrm1003ModelService, Shift } from './services/model.service';
import { Hrm1003DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1003',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, PageFormLayoutComponent],
  providers: [Hrm1003ModelService, Hrm1003DataService],
  templateUrl: './hrm1003.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Hrm1003Component implements OnInit {
  public model             = inject(Hrm1003ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  /** Weekly-off day toggles (bitmask Sun..Sat). */
  readonly weekDays = [
    { label: 'Sun', bit: 1 }, { label: 'Mon', bit: 2 }, { label: 'Tue', bit: 4 },
    { label: 'Wed', bit: 8 }, { label: 'Thu', bit: 16 }, { label: 'Fri', bit: 32 }, { label: 'Sat', bit: 64 },
  ];

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => {
      this.permissionService.useLocalPermissions('HRM_1003');
      this.model.loadShifts();
    });
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
    this.model.pager.reset();
  }

  get formdata() { return this.model.form; }

  onSave(): void { this.model.onSave(); }
  onNew(): void  { this.model.onNew(); }

  onReset(): void {
    if (this.model.selectedShiftNo()) {
      const original = this.model.shifts().find((s) => s.shift_no === this.model.selectedShiftNo());
      if (original) this.model.selectShift(original);
    } else {
      this.model.onNew();
    }
  }

  onDelete(): void {
    if (!this.model.selectedShiftNo()) return;
    this.alertService.deleteConfirm().subscribe((confirmed) => {
      if (confirmed) this.model.onDelete();
    });
  }

  selectShift(shift: Shift, index?: number): void {
    this.model.selectShift(shift, index);
  }

  toUpper(controlName: string): void {
    const ctrl = this.formdata.get(controlName);
    if (ctrl?.value) ctrl.setValue(ctrl.value.toUpperCase(), { emitEvent: false });
  }

  isOffDay(bit: number): boolean {
    return ((this.formdata.get('weekly_off_mask')?.value ?? 0) & bit) === bit;
  }

  toggleOffDay(bit: number): void {
    const cur = this.formdata.get('weekly_off_mask')?.value ?? 0;
    this.formdata.get('weekly_off_mask')?.setValue(this.isOffDay(bit) ? cur & ~bit : cur | bit);
  }

  toggleNight(event: MatCheckboxChange): void {
    this.formdata.get('is_night_shift')?.setValue(event.checked ? 1 : 0);
  }

  toggleActive(event: MatCheckboxChange): void {
    this.formdata.get('is_active')?.setValue(event.checked ? 1 : 0);
  }
}

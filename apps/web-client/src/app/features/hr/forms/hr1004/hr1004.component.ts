import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { Hr1004ModelService, Grade } from './services/model.service';
import { Hr1004DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hr1004',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    PageFormLayoutComponent,
  ],
  providers: [Hr1004ModelService, Hr1004DataService],
  templateUrl: './hr1004.component.html',
  styles: [`
    :host { display: block; height: 100%; }
  `],
})
export class Hr1004Component implements OnInit {
  public model             = inject(Hr1004ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => {
      this.permissionService.useLocalPermissions('HR_1004');
      this.model.loadGrades();
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
    if (this.model.selectedGradeNo()) {
      const original = this.model.grades().find(
        (g) => g.grade_no === this.model.selectedGradeNo(),
      );
      if (original) this.model.selectGrade(original);
    } else {
      this.model.onNew();
    }
  }

  onDelete(): void {
    if (!this.model.selectedGradeNo()) return;
    this.alertService.deleteConfirm().subscribe((confirmed) => {
      if (confirmed) this.model.onDelete();
    });
  }

  selectGrade(grade: Grade, index?: number): void {
    this.model.selectGrade(grade, index);
  }

  toUpper(controlName: string): void {
    const ctrl = this.formdata.get(controlName);
    if (ctrl?.value) ctrl.setValue(ctrl.value.toUpperCase(), { emitEvent: false });
  }

  toggleActive(event: MatCheckboxChange): void {
    this.formdata.get('is_active')?.setValue(event.checked ? 1 : 0);
  }

  toggleOvertime(event: MatCheckboxChange): void {
    this.formdata.get('is_overtime_eligible')?.setValue(event.checked ? 1 : 0);
  }
}

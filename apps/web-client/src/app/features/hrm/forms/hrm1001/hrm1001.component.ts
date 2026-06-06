import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Hrm1001ModelService } from './services/model.service';
import { Hrm1001DataService } from './services/data.service';
import { hrmConstants } from '../../constants/hrm.constants';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1001',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent],
  providers: [Hrm1001ModelService, Hrm1001DataService],
  templateUrl: './hrm1001.component.html',
  styles: [],
})
export class Hrm1001Component implements OnInit {
  public model = inject(Hrm1001ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  readonly genderOptions       = hrmConstants.genderOptions;
  readonly maritalStatusOptions = hrmConstants.maritalStatusOptions;
  readonly employmentTypeOptions = hrmConstants.employmentTypeOptions;
  readonly employeeStatusOptions = hrmConstants.employeeStatusOptions;
  readonly bloodGroups          = hrmConstants.bloodGroups;
  readonly mfsProviders         = hrmConstants.mfsProviders;

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('HRM_1001');
    this.model.initForm();
    this.model.loadDepartments();
    this.model.loadDesignations();
    this.model.loadEmployees();
  }

  onSave(): void { this.model.onSave(); }
  onNew(): void  { this.model.onNew(); }

  onReset(): void {
    if (this.model.selectedEmployeeNo()) {
      const emp = this.model.employees().find(
        (e) => e.employee_no === this.model.selectedEmployeeNo(),
      );
      if (emp) this.model.selectEmployee(emp);
    } else {
      this.model.onNew();
    }
  }

  onDelete(): void {
    if (!this.model.selectedEmployeeNo()) return;
    this.alertService.deleteConfirm('Delete this employee?').subscribe((ok) => {
      if (ok) this.model.onDelete();
    });
  }
}

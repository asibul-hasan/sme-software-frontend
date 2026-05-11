import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Hr1001ModelService } from './services/model.service';
import { Hr1001DataService } from './services/data.service';
import { hrConstants } from '../../constants/hr.constants';

@Component({
  selector: 'app-hr1001',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent],
  providers: [Hr1001ModelService, Hr1001DataService],
  templateUrl: './hr1001.component.html',
  styles: [],
})
export class Hr1001Component implements OnInit {
  public model = inject(Hr1001ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  readonly genderOptions       = hrConstants.genderOptions;
  readonly maritalStatusOptions = hrConstants.maritalStatusOptions;
  readonly employmentTypeOptions = hrConstants.employmentTypeOptions;
  readonly employeeStatusOptions = hrConstants.employeeStatusOptions;
  readonly bloodGroups          = hrConstants.bloodGroups;
  readonly mfsProviders         = hrConstants.mfsProviders;

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('HR_1001');
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

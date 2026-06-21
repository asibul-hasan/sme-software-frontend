import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormGroup } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { Hrm1201ModelService, SalaryStructure } from './services/model.service';
import { Hrm1201DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';

import { hrmConstants } from '../../constants/hrm.constants';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1201',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, PageFormLayoutComponent],
  providers: [Hrm1201ModelService, Hrm1201DataService],
  templateUrl: './hrm1201.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Hrm1201Component implements OnInit {
  public model             = inject(Hrm1201ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly statusOptions = hrmConstants.salaryStructureStatuses;

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => {
      this.permissionService.useLocalPermissions('HRM_1201');
      this.model.loadEmployees();
      this.model.loadDesignations();
      this.model.loadGrades();
      this.model.loadComponents();
      this.model.loadStructures();
    });
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
    this.model.pager.reset();
  }

  get formdata() { return this.model.form; }
  lineGroup(i: number): FormGroup { return this.model.linesArray.at(i) as FormGroup; }

  onSave(): void { this.model.onSave(); }
  onNew(): void  { this.model.onNew(); }
  onStartRevision(): void { this.model.startRevision(); }

  onReset(): void {
    if (this.model.selectedNo()) {
      const original = this.model.structures().find((s) => s.salary_structure_no === this.model.selectedNo());
      if (original) this.model.selectStructure(original);
    } else {
      this.model.onNew();
    }
  }

  onDelete(): void {
    if (!this.model.selectedNo()) return;
    this.alertService.deleteConfirm().subscribe((confirmed) => {
      if (confirmed) this.model.onDelete();
    });
  }

  selectStructure(item: SalaryStructure): void {
    this.model.selectStructure(item);
  }

  statusLabel(value: number): string {
    return this.statusOptions.find((s) => s.value === value)?.label ?? String(value);
  }

  toggleFlag(control: string, event: MatCheckboxChange): void {
    this.formdata.get(control)?.setValue(event.checked ? 1 : 0);
  }
}

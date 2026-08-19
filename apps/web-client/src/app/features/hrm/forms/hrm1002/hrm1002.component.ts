import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Hrm1002ModelService } from './services/model.service';
import { Hrm1002DataService } from './services/data.service';
import { DecimalInputDirective } from '@app/shared/directives/decimal-input.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1002',
  standalone: true,
  imports: [DecimalInputDirective, SharedModule, CommonModule, PageFormLayoutComponent],
  providers: [Hrm1002ModelService, Hrm1002DataService],
  templateUrl: './hrm1002.component.html',
  styles: [],
})
export class Hrm1002Component implements OnInit {
  public model = inject(Hrm1002ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  activeTab = signal<'department' | 'designation'>('department');

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('HRM_1002');
    this.model.initDeptForm();
    this.model.initDesigForm();
    this.model.loadDepartments();
    this.model.loadDesignations();
    this.model.loadEmployees();
    this.model.loadGrades();
  }

  switchTab(tab: 'department' | 'designation'): void {
    this.activeTab.set(tab);
  }

  // ─── Department tab handlers ───────────────────────────────────────────────
  onDeptSave(): void { this.model.onSaveDept(); }
  onDeptNew(): void  { this.model.onNewDept(); }
  onDeptReset(): void {
    if (this.model.selectedDeptNo()) {
      const d = this.model.departments().find(x => x.department_no === this.model.selectedDeptNo());
      if (d) this.model.selectDept(d);
    } else {
      this.model.onNewDept();
    }
  }
  onDeptDelete(): void {
    if (!this.model.selectedDeptNo()) return;
    this.alertService.deleteConfirm('Delete this department?').subscribe((ok) => {
      if (ok) this.model.onDeleteDept();
    });
  }

  // ─── Designation tab handlers ──────────────────────────────────────────────
  onDesigSave(): void { this.model.onSaveDesig(); }
  onDesigNew(): void  { this.model.onNewDesig(); }
  onDesigReset(): void {
    if (this.model.selectedDesigNo()) {
      const d = this.model.designations().find(x => x.designation_no === this.model.selectedDesigNo());
      if (d) this.model.selectDesig(d);
    } else {
      this.model.onNewDesig();
    }
  }
  onDesigDelete(): void {
    if (!this.model.selectedDesigNo()) return;
    this.alertService.deleteConfirm('Delete this designation?').subscribe((ok) => {
      if (ok) this.model.onDeleteDesig();
    });
  }
}

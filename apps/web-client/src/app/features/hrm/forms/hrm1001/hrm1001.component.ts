import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { TableExportService } from '../../../../shared/components/common-table';
import { Hrm1001ModelService } from './services/model.service';
import { Hrm1001DataService } from './services/data.service';
import { hrmConstants } from '../../constants/hrm.constants';
import { employeeProfileReportTemplate } from '../../report-templates';

import { AppDatePickerComponent } from '../../../../shared/components/date-picker';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1001',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent, AppDatePickerComponent],
  providers: [Hrm1001ModelService, Hrm1001DataService],
  templateUrl: './hrm1001.component.html',
  styleUrls: ['./hrm1001.component.scss'],
  styles: [`
    .logo-drop-zone {
      border: 2px dashed var(--border-color);
      border-radius: 10px;
      min-height: 140px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: var(--bg-secondary);
      position: relative;
      padding: 16px;
    }
    .logo-drop-zone:hover,
    .logo-drop-zone.drag-over {
      border-color: var(--indigo);
      background: rgba(99, 102, 241, 0.04);
    }
    .logo-drop-zone.drag-over { border-style: solid; }
    .logo-drop-zone input[type="file"] {
      position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%;
    }
    .logo-preview-box {
      width: 100%;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--bg-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      min-height: 120px;
    }
    .logo-preview-box img {
      max-width: 100%;
      max-height: 160px;
      object-fit: contain;
      padding: 12px;
    }
  `],
})
export class Hrm1001Component implements OnInit {
  public model = inject(Hrm1001ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);
  private tableExport = inject(TableExportService);

  readonly genderOptions       = hrmConstants.genderOptions;
  readonly maritalStatusOptions = hrmConstants.maritalStatusOptions;
  readonly employmentTypeOptions = hrmConstants.employmentTypeOptions;
  readonly employeeStatusOptions = hrmConstants.employeeStatusOptions;
  readonly contractTypeOptions   = hrmConstants.contractTypeOptions;
  readonly taxpayerClassOptions  = hrmConstants.taxpayerClasses;
  readonly bloodGroups          = hrmConstants.bloodGroups;
  readonly mfsProviders         = hrmConstants.mfsProviders;

  isPhotoDragActive = signal(false);
  isSignatureDragActive = signal(false);

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('HRM_1001');
    this.model.initForm();
    this.model.loadDepartments();
    this.model.loadDesignations();
    this.model.loadGrades();
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

  selectedImportFile(): File | null {
    return this.model.selectedImportFile();
  }

  clearSelectedImportFile(): void {
    this.model.clearSelectedImportFile();
  }

  // Photo drag-drop handlers
  onPhotoDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isPhotoDragActive.set(true);
  }

  onPhotoDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isPhotoDragActive.set(false);
  }

  onPhotoDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isPhotoDragActive.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      const input = document.createElement('input');
      input.type = 'file';
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      this.model.handleImageUpload({ target: input } as unknown as Event, 'photo_url');
    }
  }

  // Signature drag-drop handlers
  onSignatureDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isSignatureDragActive.set(true);
  }

  onSignatureDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isSignatureDragActive.set(false);
  }

  onSignatureDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isSignatureDragActive.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      const input = document.createElement('input');
      input.type = 'file';
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      this.model.handleImageUpload({ target: input } as unknown as Event, 'signature_url');
    }
  }

  exportProfilePdf(): void {
    if (!this.model.selectedEmployeeNo()) return;
    const context = this.model.reportContext();
    const fileName = `${employeeProfileReportTemplate.fileName}-${context.employee['employee_id'] || 'employee'}`;
    void this.tableExport.exportToPdf(
      employeeProfileReportTemplate.buildRows(context),
      employeeProfileReportTemplate.columns,
      fileName,
      employeeProfileReportTemplate.title,
    );
  }

  printProfile(): void {
    if (!this.model.selectedEmployeeNo()) return;
    const context = this.model.reportContext();
    this.tableExport.printTable(
      employeeProfileReportTemplate.buildRows(context),
      employeeProfileReportTemplate.columns,
      employeeProfileReportTemplate.title,
    );
  }
}

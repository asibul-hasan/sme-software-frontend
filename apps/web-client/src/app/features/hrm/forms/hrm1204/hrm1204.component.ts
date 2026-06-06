import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { Hrm1204ModelService } from './services/model.service';
import { Hrm1204DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';

import { hrmConstants } from '../../constants/hrm.constants';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1204',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent],
  providers: [Hrm1204ModelService, Hrm1204DataService],
  templateUrl: './hrm1204.component.html',
  styles: [`
    :host { display: block; height: 100%; }
    .payslip-sheet { max-width: 720px; margin: 0 auto; font-size: 13px; }
    .payslip-sheet .ps-head { border-bottom: 2px solid var(--border-color); }
    .ps-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed var(--border-color); }
    .ps-col-title { font-weight: 600; }
    @media print {
      :host ::ng-deep .page-card-header, :host ::ng-deep .form-action-bar, :host ::ng-deep app-sidebar { display: none !important; }
    }
  `],
})
export class Hrm1204Component implements OnInit {
  public model             = inject(Hrm1204ModelService);
  public permissionService = inject(FormPermissionService);

  readonly statusOptions = hrmConstants.payrollStatuses;

  ngOnInit(): void {
    setTimeout(() => {
      this.permissionService.useLocalPermissions('HRM_1204');
      this.model.loadLookups();
      this.model.loadRuns();
    });
  }

  onRunChange(no: number): void { this.model.selectRun(no != null ? Number(no) : null); }
  onPayslipChange(no: number): void { this.model.selectPayslip(no != null ? Number(no) : null); }
  print(): void { window.print(); }

  statusLabel(v?: number | null): string { return this.statusOptions.find((s) => s.value === v)?.label ?? ''; }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Sys1101ModelService } from './services/model.service';
import { Sys1101DataService } from './services/data.service';

@Component({
  selector: 'app-sys1101',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent],
  providers: [Sys1101ModelService, Sys1101DataService],
  templateUrl: './sys1101.component.html',
  styles: [`
    .employee-summary-card .summary-item {
      min-height: 58px;
      padding: 10px 12px;
      border-radius: 8px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
    }
    .summary-label {
      font-size: 11px;
      color: var(--text-secondary);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0;
      margin-bottom: 3px;
    }
    .summary-value {
      color: var(--text-primary);
      font-weight: 700;
      font-size: 13px;
      overflow-wrap: anywhere;
    }
    .security-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 9px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      background: rgba(var(--primary-rgb), 0.1);
      color: var(--primary);
    }
    .role-row {
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 8px;
      background: var(--card-bg);
    }
  `],
})
export class Sys1101Component implements OnInit {
  public model = inject(Sys1101ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('SYS_1101');
    this.model.initForm();
    this.model.loadInitial();
  }

  onSave(): void { this.model.onSave(); }
  onNew(): void { this.model.onNew(); }
  onReset(): void { this.model.onReset(); }

  onDelete(): void {
    if (!this.model.selectedUserNo()) return;
    this.alertService.deleteConfirm('Delete this user?').subscribe((ok) => {
      if (ok) this.model.onDelete();
    });
  }
}

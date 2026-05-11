import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { sysConstants } from '../../constants/sys.constants';
import { Sys1002ModelService } from './services/model.service';
import { Sys1002DataService } from './services/data.service';
import { AlertService } from '../../../../core/services/alert.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-sys1002',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent],
  // Sys1002DataService and DatePipe are provided here so the model
  // service can inject them without going to root scope.
  providers: [Sys1002ModelService, Sys1002DataService, DatePipe],
  templateUrl: './sys1002.component.html',
  styles: [],
})
export class Sys1002Component implements OnInit {
  public model = inject(Sys1002ModelService);
  readonly sysConstants = sysConstants;

  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.useLocalPermissions('SYS_1002');
    this.model.loadBranches();
    this.model.loadEmployees();
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
  }

  onSave(): void {
    this.model.onSave();
  }

  onNew(): void {
    this.model.onNew();
  }

  onReset(): void {
    if (this.model.selectedBranchNo()) {
      const b = this.model
        .branches()
        .find((x) => x.branch_no === this.model.selectedBranchNo());
      if (b) this.model.selectBranch(b);
    } else {
      this.onNew();
    }
  }

  onDelete(): void {
    if (!this.model.selectedBranchNo()) return;

    this.alertService
      .deleteConfirm('Are you sure you want to delete this branch?')
      .subscribe((confirmed) => {
        if (confirmed) this.model.onDelete();
      });
  }
}

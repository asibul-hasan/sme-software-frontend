import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { SysDataService } from '../../services/data.service';
import { finalize } from 'rxjs/operators';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { sysConstants } from '../../constants/sys.constants';
import { Sys1002ModelService } from './services/model.service';
import { AlertService } from 'apps/web-client/src/app/core/services/alert.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-sys1002',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent],
  providers: [Sys1002ModelService, DatePipe],
  templateUrl: './sys1002.component.html',
  styles: [],
})
export class Sys1002Component implements OnInit {
  public model = inject(Sys1002ModelService);
  readonly sysConstants = sysConstants;

  private sysService = inject(SysDataService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);
  private toastr = inject(ToastrService);

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.loadPermissions('SYS_1002').subscribe();
    this.model.loadBranches();
  }

  onSearchTermChange(val: string) {
    this.model.searchTerm.set(val);
  }

  onSave() {
    this.model.onSave();
  }

  onNew() {
    this.model.onNew();
  }

  onReset() {
    if (this.model.selectedBranchNo()) {
      const b = this.model.branches().find((x) => x.branchNo === this.model.selectedBranchNo());
      if (b) this.model.selectBranch(b);
    } else {
      this.onNew();
    }
  }

  onDelete() {
    if (!this.model.selectedBranchNo()) return;

    this.alertService
      .deleteConfirm('Are you sure you want to delete this branch?')
      .subscribe((confirmed) => {
        if (confirmed) {
          this.model.isLoading.set(true);
          this.sysService
            .delete<any>('branch/delete', {
              branch_no: this.model.selectedBranchNo(),
            })
            .pipe(finalize(() => this.model.isLoading.set(false)))
            .subscribe({
              next: (res) => {
                if (res.success) {
                  this.toastr.success('Branch deleted successfully');
                  this.model.loadBranches();
                } else {
                  this.toastr.error(res.message || 'Delete failed');
                }
              },
              error: (err) => {
                this.toastr.error('Server error during delete');
                console.error(err);
              },
            });
        }
      });
  }
}

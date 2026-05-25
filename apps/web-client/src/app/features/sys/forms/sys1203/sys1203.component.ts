import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Sys1203ModelService } from './services/model.service';
import { Sys1203DataService } from './services/data.service';

/**
 * SYS1203 – File/Image Manager. Upload, preview, download and delete binaries stored in
 * sys_file (company logo, employee photo/signature, etc.), scoped to the active company.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sys1203',
  standalone: true,
  imports: [SharedModule, CommonModule],
  providers: [Sys1203ModelService, Sys1203DataService],
  templateUrl: './sys1203.component.html',
  styles: [],
})
export class Sys1203Component implements OnInit, OnDestroy {
  public model = inject(Sys1203ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('SYS_1203');
    this.model.loadFiles();
  }

  ngOnDestroy(): void {
    this.model.clearThumbs();
  }

  onFilterChange(value: string): void {
    this.model.filterType.set(value ? Number(value) : null);
    this.model.loadFiles();
  }

  onDelete(fileNo: number): void {
    this.alertService.deleteConfirm('Delete this file?').subscribe((ok) => {
      if (ok) this.model.delete(fileNo);
    });
  }
}

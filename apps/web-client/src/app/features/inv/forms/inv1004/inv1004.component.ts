import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Inv1004ModelService } from './services/model.service';
import { Inv1004DataService } from './services/data.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inv1004',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent],
  providers: [Inv1004ModelService, Inv1004DataService],
  templateUrl: './inv1004.component.html',
  styles: [],
})
export class Inv1004Component implements OnInit {
  public model = inject(Inv1004ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.useLocalPermissions('INV_1004');
    this.model.loadList();
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
    this.model.pager.reset();
  }
  onSave(): void { this.model.onSave(); }
  onNew(): void { this.model.onNew(); }
  onReset(): void {
    const no = this.model.selectedNo();
    const item = this.model.items().find((x) => x.brand_no === no);
    if (item) {
      this.model.select(item);
    } else {
      this.model.onNew();
    }
  }
  onDelete(): void {
    if (!this.model.selectedNo()) return;
    this.alertService.deleteConfirm('Delete this brand?').subscribe((ok) => {
      if (ok) this.model.onDelete();
    });
  }
}

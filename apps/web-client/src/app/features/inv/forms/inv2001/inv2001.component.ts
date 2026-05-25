import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Inv2001ModelService } from './services/model.service';
import { Inv2001DataService } from './services/data.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inv2001',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent],
  providers: [Inv2001ModelService, Inv2001DataService],
  templateUrl: './inv2001.component.html',
  styles: [],
})
export class Inv2001Component implements OnInit {
  public model = inject(Inv2001ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.useLocalPermissions('INV_2001');
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
    const item = this.model.items().find((x) => x.warehouse_no === no);
    item ? this.model.select(item) : this.model.onNew();
  }
  onDelete(): void {
    if (!this.model.selectedNo()) return;
    this.alertService.deleteConfirm('Delete this warehouse?').subscribe((ok) => {
      if (ok) this.model.onDelete();
    });
  }
}

import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Inv1101ModelService } from './services/model.service';
import { Inv1101DataService } from './services/data.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inv1101',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent],
  providers: [Inv1101ModelService, Inv1101DataService],
  templateUrl: './inv1101.component.html',
  styles: [],
})
export class Inv1101Component implements OnInit {
  public model = inject(Inv1101ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.useLocalPermissions('INV_1101');
    this.model.loadLookups();
    this.model.loadList();
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
    this.model.pager.reset();
  }
  onSave(): void { this.model.onSaveDraft(); }
  onNew(): void { this.model.onNew(); }
  onReset(): void {
    const no = this.model.selectedNo();
    const item = this.model.items().find((x) => x.adjustment_no === no);
    item ? this.model.select(item) : this.model.onNew();
  }
  onDelete(): void {
    if (!this.model.selectedNo()) return;
    this.alertService.deleteConfirm('Delete this opening draft?').subscribe((ok) => {
      if (ok) this.model.onDelete();
    });
  }
  onPost(): void {
    this.alertService.deleteConfirm('Post this opening stock? This cannot be undone.').subscribe((ok) => {
      if (ok) this.model.onPost();
    });
  }
}

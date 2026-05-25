import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Inv1102ModelService } from './services/model.service';
import { Inv1102DataService } from './services/data.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inv1102',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent],
  providers: [Inv1102ModelService, Inv1102DataService],
  templateUrl: './inv1102.component.html',
  styles: [],
})
export class Inv1102Component implements OnInit {
  public model = inject(Inv1102ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.useLocalPermissions('INV_1102');
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
    this.alertService.deleteConfirm('Delete this draft adjustment?').subscribe((ok) => { if (ok) this.model.onDelete(); });
  }
  onSubmit(): void { this.model.onSubmit(); }
  onApprove(): void {
    this.alertService.deleteConfirm('Approve & post this adjustment? Stock will be updated.').subscribe((ok) => { if (ok) this.model.onApprove(); });
  }
  onCancel(): void {
    this.alertService.deleteConfirm('Cancel this posted adjustment? A reversal will be posted.').subscribe((ok) => { if (ok) this.model.onCancel(); });
  }
}

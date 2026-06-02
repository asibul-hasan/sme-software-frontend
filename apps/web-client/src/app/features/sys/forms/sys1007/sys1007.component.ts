import { Component, ChangeDetectionStrategy, OnInit, inject, effect, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { TreeViewComponent, TreeViewConfig } from '../../../../shared/components/tree-view';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Sys1007ModelService, ICostCenter } from './services/model.service';
import { Sys1007DataService } from './services/data.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sys1007',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent, TreeViewComponent],
  providers: [Sys1007ModelService, Sys1007DataService],
  templateUrl: './sys1007.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Sys1007Component implements OnInit {
  public model = inject(Sys1007ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);
  private el = inject(ElementRef);

  /** Drives the reusable <app-tree-view>. Maps cost-center fields → tree slots. */
  readonly treeConfig: TreeViewConfig = {
    idField: 'cost_center_no',
    parentField: 'parent_cost_center_no',
    labelField: 'cost_center_id',
    sublabelField: 'cost_center_name',
    badge: (row) =>
      row['is_active'] === 1
        ? { label: 'Active', variant: 'success' }
        : { label: 'Inactive', variant: 'neutral' },
  };

  constructor() {
    // Scroll the selected tree node into view whenever selection changes.
    effect(() => {
      this.model.selectedNo();
      setTimeout(() => {
        this.el.nativeElement
          .querySelector('.tv-node.is-active')
          ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 50);
    });
  }

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.useLocalPermissions('SYS_1007');
    this.model.loadBranches();
    this.model.loadList();
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
  }

  toUpper(controlName: string): void {
    const ctrl = this.model.form.get(controlName);
    if (ctrl) ctrl.setValue(ctrl.value.toUpperCase(), { emitEvent: false });
  }

  toggleActive(event: MatCheckboxChange): void {
    this.model.form.get('is_active')?.setValue(event.checked ? 1 : 0);
  }

  onSave(): void { this.model.onSave(); }
  onNew(): void { this.model.onNew(); }
  onReset(): void {
    const no = this.model.selectedNo();
    const item = this.model.items().find((x) => x.cost_center_no === no);
    item ? this.model.select(item) : this.model.onNew();
  }
  onDelete(): void {
    if (!this.model.selectedNo()) return;
    this.alertService.deleteConfirm('Delete this cost center?').subscribe((ok) => {
      if (ok) this.model.onDelete();
    });
  }

  /** Tree node click → load that cost center into the form. */
  onNodeClick(row: Record<string, unknown>): void {
    this.model.select(row as unknown as ICostCenter);
  }
}

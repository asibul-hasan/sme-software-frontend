import { Component, ChangeDetectionStrategy, OnInit, inject, effect, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { TreeViewComponent, TreeViewConfig } from '../../../../shared/components/tree-view';
import { Fin1002ModelService, AccountGroup } from './services/model.service';
import { Fin1002DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { finConstants } from '../../constants/fin.constants';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1002',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, PageFormLayoutComponent, TreeViewComponent],
  providers: [Fin1002ModelService, Fin1002DataService],
  templateUrl: './fin1002.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Fin1002Component implements OnInit {
  public model             = inject(Fin1002ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);
  private el               = inject(ElementRef);

  readonly rootTypes = finConstants.rootTypes;
  readonly drCr      = finConstants.drCr;
  readonly treeConfig: TreeViewConfig = {
    idField: 'account_group_no',
    parentField: 'parent_group_no',
    labelField: (row) => `${row['account_group_id']} ${row['group_name']}`,
    statusDot: (row) => row['is_active'] === 1,
    emptyText: 'No account groups found',
    emptyIcon: 'account_tree',
    icon: ({ hasChildren, expanded }) => hasChildren ? (expanded ? 'folder_open' : 'folder') : 'account_tree',
  };

  constructor() {
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
    setTimeout(() => { this.permissionService.useLocalPermissions('FIN_1002'); this.model.load(); });
  }

  onSearchTermChange(v: string): void { this.model.searchTerm.set(v); }
  get formdata() { return this.model.form; }

  onSave(): void { this.model.onSave(); }
  onNew(): void  { this.model.onNew(); }
  onReset(): void {
    const o = this.model.groups().find((g) => g.account_group_no === this.model.selectedNo());
    if (o) this.model.select(o); else this.model.onNew();
  }
  onDelete(): void {
    if (!this.model.selectedNo()) return;
    this.alertService.deleteConfirm().subscribe((ok) => { if (ok) this.model.onDelete(); });
  }
  select(item: AccountGroup): void { this.model.select(item); }
  onNodeClick(row: Record<string, unknown>): void { this.model.select(row as unknown as AccountGroup); }
  toUpper(c: string): void { const ctrl = this.formdata.get(c); if (ctrl?.value) ctrl.setValue(ctrl.value.toUpperCase(), { emitEvent: false }); }

  rootLabel(v?: number | null): string { return this.rootTypes.find((r) => r.value === v)?.label ?? ''; }
}

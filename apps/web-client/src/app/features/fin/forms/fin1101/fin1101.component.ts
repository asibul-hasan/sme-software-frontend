import { Component, ChangeDetectionStrategy, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';
import { Fin1101ModelService, Voucher } from './services/model.service';
import { Fin1101DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { finConstants } from '../../constants/fin.constants';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1101',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, PageFormLayoutComponent, CommonTableComponent],
  providers: [Fin1101ModelService, Fin1101DataService],
  templateUrl: './fin1101.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Fin1101Component implements OnInit {
  public model             = inject(Fin1101ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly statusOptions = finConstants.voucherStatuses;

  // new-line entry
  newAccount: number | null = null;
  newDebit: number | null = null;
  newCredit: number | null = null;
  newNarration = '';

  readonly lineColumns: ColumnDef[] = [
    { title: 'Account',   field: 'account_name',  cellType: 'text' },
    { title: 'Narration', field: 'line_narration', cellType: 'text' },
    { title: 'Debit',     field: 'debit',  cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
    { title: 'Credit',    field: 'credit', cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
  ];
  readonly lineConfig: Partial<TableConfig> = {
    showSearch: false, pagination: false, dense: true, striped: true,
    showColumnToggle: false, showExport: false, showTitle: false, maxHeight: '320px',
    showActions: true,
    actions: [{ type: 'delete', icon: 'delete', tooltip: 'Remove', variant: 'danger', onClick: (row) => this.model.removeLine(row['__uid'] as number) }],
  };
  readonly lineData = computed(() => this.model.lines() as unknown as Record<string, unknown>[]);

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => { this.permissionService.useLocalPermissions('FIN_1101'); this.model.loadLookups(); this.model.load(); });
  }

  onSearchTermChange(v: string): void { this.model.searchTerm.set(v); this.model.pager.reset(); }
  get formdata() { return this.model.form; }
  get status(): number { return this.model.status(); }
  get editable(): boolean { return this.model.isDraft(); }

  onSave(): void { this.model.onSave(); }
  onNew(): void  { this.model.onNew(); this.resetNewLine(); }
  onReset(): void {
    const o = this.model.vouchers().find((v) => v.voucher_no === this.model.selectedNo());
    if (o) this.model.select(o); else this.model.onNew();
    this.resetNewLine();
  }
  onDelete(): void {
    if (!this.model.selectedNo() || this.status !== 1) return;
    this.alertService.deleteConfirm().subscribe((ok) => { if (ok) this.model.onDelete(); });
  }
  select(item: Voucher): void { this.model.select(item); }

  addLine(): void { if (this.model.addLine(this.newAccount, this.newDebit ?? 0, this.newCredit ?? 0, this.newNarration)) this.resetNewLine(); }
  private resetNewLine(): void { this.newAccount = null; this.newDebit = null; this.newCredit = null; this.newNarration = ''; }

  submit(): void {
    this.alertService.confirm('Submit this voucher for posting? Auto-posts to the ledger when no approval workflow is configured.', 'Submit Voucher', 'primary')
      .subscribe((ok) => { if (ok) this.model.doAction('submit'); });
  }
  approve(): void { this.model.doAction('approve'); }
  reject(): void { this.model.doAction('reject'); }
  cancel(): void {
    this.alertService.confirm('Cancel this voucher? A posted voucher will be reversed in the ledger.', 'Cancel Voucher', 'warn')
      .subscribe((ok) => { if (ok) this.model.doAction('cancel'); });
  }

  statusLabel(v: number): string { return this.statusOptions.find((s) => s.value === v)?.label ?? String(v); }
  statusClass(v: number): string { return v === 2 ? 'list-item-tag--primary' : v === 3 ? 'list-item-tag--warning' : ''; }
}

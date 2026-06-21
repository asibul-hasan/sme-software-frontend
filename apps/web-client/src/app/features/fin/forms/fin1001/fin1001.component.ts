import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { Fin1001ModelService, Account } from './services/model.service';
import { Fin1001DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { AuthContextService } from '../../../../core/services/auth-context.service';
import { finConstants } from '../../constants/fin.constants';

import { PdfTemplateService } from '../../../../shared/pdf-templates';
import { buildCoaReportContext, CoaReportContext } from '../../report-templates';
import { pdfReportTemplate } from '../../../../shared/pdf-templates';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1001',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    PageFormLayoutComponent,
  ],
  providers: [Fin1001ModelService, Fin1001DataService],
  templateUrl: './fin1001.component.html',
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class Fin1001Component implements OnInit {
  public model = inject(Fin1001ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);
  private pdfService = inject(PdfTemplateService);

  readonly drCr = finConstants.drCr;
  readonly controlTypes = finConstants.controlTypes;
  readonly rootTypes = finConstants.rootTypes;

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => {
      this.permissionService.useLocalPermissions('FIN_1001');
      this.model.loadGroups();
      this.model.load();
    });

    this.formdata.get('account_group_no')?.valueChanges.subscribe((groupNo) => {
      const group = this.model
        .groups()
        .find((g) => g.account_group_no === groupNo);
      if (group) {
        const drCr =
          group.root_type === 1 || group.root_type === 5 ? 'dr' : 'cr';
        this.formdata.patchValue({ opening_dr_cr: drCr }, { emitEvent: false });
      }
    });
  }

  onSearchTermChange(v: string): void {
    this.model.searchTerm.set(v);
    this.model.pager.reset();
  }
  get formdata() {
    return this.model.form;
  }

  onSave(): void {
    this.model.onSave();
  }
  onNew(): void {
    this.model.onNew();
  }
  onReset(): void {
    const o = this.model
      .accounts()
      .find((a) => a.account_no === this.model.selectedNo());
    if (o) this.model.select(o);
    else this.model.onNew();
  }
  onDelete(): void {
    if (!this.model.selectedNo()) return;
    this.alertService.deleteConfirm().subscribe((ok) => {
      if (ok) this.model.onDelete();
    });
  }
  select(item: Account): void {
    this.model.select(item);
  }
  toUpper(c: string): void {
    const ctrl = this.formdata.get(c);
    if (ctrl?.value)
      ctrl.setValue(ctrl.value.toUpperCase(), { emitEvent: false });
  }

  controlLabel(v?: number | null): string {
    const label = this.controlTypes.find((c) => c.value === v)?.label ?? '';
    if (label === 'Accounts Payable') return 'AP';
    if (label === 'Accounts Receivable') return 'AR';
    return label;
  }
  rootLabel(v?: number | null): string {
    return this.rootTypes.find((r) => r.value === v)?.label ?? '';
  }

  // ── PDF COA Print ─────────────────────────────────────────────────────
  readonly coaPdfContext = computed<CoaReportContext | null>(() => {
    const accounts = this.model.accounts();
    if (!accounts || accounts.length === 0) return null;
    return {
      currency_code: 'BDT',
      rows: accounts.map((a) => ({
        account_group_name: a.account_group_name ?? '',
        account_code: a.account_code ?? '',
        account_name: a.account_name ?? '',
        control_type: a.control_type,
        control_type_label: this.controlLabel(a.control_type),
        is_postable: a.is_postable,
      })),
    };
  });

  async printCoa(): Promise<void> {
    const ctx = this.coaPdfContext();
    if (!ctx) return;
    const reportCtx = buildCoaReportContext(ctx);
    await this.pdfService.render(pdfReportTemplate, reportCtx);
  }
}


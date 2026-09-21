import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  computed,
  effect,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { TreeViewComponent, TreeViewConfig } from '../../../../shared/components/tree-view';
import { Fin1001ModelService, Account } from './services/model.service';
import { Fin1001DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { finConstants } from '../../constants/fin.constants';

import { PdfTemplateService } from '../../../../shared/pdf-templates';
import { buildCoaReportContext, CoaReportContext } from '../../report-templates';
import { pdfReportTemplate } from '../../../../shared/pdf-templates';

/**
 * FIN_1001 – Chart of Accounts Component.
 * Provides a single unified interface combining Account Groups hierarchy and leaf Accounts.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1001',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatTooltipModule,
    SharedModule,
    PageFormLayoutComponent,
    TreeViewComponent,
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
  public readonly model = inject(Fin1001ModelService);
  public readonly permissionService = inject(FormPermissionService);
  private readonly alertService = inject(AlertService);
  private readonly pdfService = inject(PdfTemplateService);
  private readonly el = inject(ElementRef);

  readonly drCr = finConstants.drCr;
  readonly controlTypes = finConstants.controlTypes;
  readonly rootTypes = finConstants.rootTypes;
  readonly accountCategories = finConstants.accountCategories;
  readonly accountSubCategories = finConstants.accountSubCategories;
  readonly accountClasses = finConstants.accountClasses;
  readonly currencyOptions = finConstants.currencyOptions;

  /** Tree Configuration for unified COA view. */
  readonly treeConfig: TreeViewConfig = {
    idField: 'id',
    parentField: 'parent_id',
    labelField: (row) => `${row['code'] || ''} ${row['name'] || ''}`.trim(),
    statusDot: (row) => row['is_active'] === 1,
    indent: 14,
    icon: ({ hasChildren, expanded, row }) => {
      if (row['node_type'] === 'group') {
        return hasChildren ? (expanded ? 'folder_open' : 'folder') : 'account_tree';
      }
      return 'menu_book';
    },
    showSearch: true,
    searchPlaceholder: 'Search...',
    emptyText: 'No chart of accounts found',
    emptyIcon: 'account_tree',
  };

  constructor() {
    // Scroll selected tree node into view
    effect(() => {
      this.model.selectedTreeId();
      setTimeout(() => {
        this.el.nativeElement
          .querySelector('.tv-node.is-active')
          ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 50);
    });
  }

  ngOnInit(): void {
    this.model.initForms();
    this.permissionService.useLocalPermissions('FIN_1001');
    this.model.loadAll();
  }

  onSearchTermChange(v: string): void {
    this.model.searchTerm.set(v);
  }

  onNodeClick(row: Record<string, unknown>): void {
    this.model.selectNode(row);
  }

  onNewAccount(): void {
    if (!this.model.selectedAccountNo()) return;
    this.model.onNewAccount();
  }

  onNewGroup(): void {
    this.model.onNewGroup();
  }

  onSave(): void {
    this.model.onSave();
  }

  onReset(): void {
    const acc = this.model.currentAccount();
    if (acc) {
      this.model.selectAccount(acc);
    } else {
      this.model.onNewGroup();
    }
  }

  onDelete(): void {
    const no = this.model.selectedAccountNo();
    if (!no || this.model.selectedHasChildren()) return;

    this.alertService.deleteConfirm('Delete this Chart of Accounts record?').subscribe((ok) => {
      if (ok) this.model.onDelete();
    });
  }

  toUpper(fieldName: string): void {
    const ctrl = this.model.form.get(fieldName);
    if (ctrl?.value) {
      ctrl.setValue(ctrl.value.toUpperCase(), { emitEvent: false });
    }
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

  // ── PDF COA Print ──────────────────────────────────────────────────────────
  readonly coaPdfContext = computed<CoaReportContext | null>(() => {
    const accounts = this.model.accounts();
    if (!accounts || accounts.length === 0) return null;

    const groupMap = new Map<number, Account>();
    accounts
      .filter((a) => a.is_group === 1)
      .forEach((g) => groupMap.set(g.account_no, g));

    return {
      currency_code: 'BDT',
      rows: accounts
        .filter((a) => a.is_group === 0)
        .map((a) => {
          const grp = a.parent_account_no ? groupMap.get(a.parent_account_no) : null;
          const groupName = grp ? `${grp.account_code} ${grp.account_name}` : a.parent_account_name ?? '';
          return {
            account_group_name: groupName,
            account_code: a.account_code ?? '',
            account_name: a.account_name ?? '',
            control_type: a.control_type,
            control_type_label: this.controlLabel(a.control_type),
            is_postable: a.is_postable,
          };
        }),
    };
  });

  async printCoa(): Promise<void> {
    const ctx = this.coaPdfContext();
    if (!ctx) return;
    const reportCtx = buildCoaReportContext(ctx);
    await this.pdfService.render(pdfReportTemplate, reportCtx);
  }
}

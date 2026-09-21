import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { Fin1001DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { FormUtilService } from '../../../../../core/services/form-util.service';
import { AlertService } from '../../../../../core/services/alert.service';

// ── Domain Types ─────────────────────────────────────────────────────────────

/** Full Unified Chart of Accounts entity. */
export interface Account extends BaseEntity {
  account_no: number;
  account_code: string;
  account_name: string;
  parent_account_no?: number | null;
  parent_account_code?: string | null;
  parent_account_name?: string | null;
  root_type?: number | null;
  normal_balance?: 'dr' | 'cr' | null;
  is_group: number;
  is_postable: number;
  is_control: number;
  control_type?: number | null;
  account_category?: number | null;
  sub_category?: number | null;
  account_class?: number | null;
  requires_cost_center: number;
  requires_party: number;
  requires_reconciliation: number;
  requires_branch: number;
  requires_project: number;
  requires_department: number;
  currency_no?: number | null;
  opening_balance?: number | null;
  opening_dr_cr?: 'dr' | 'cr' | null;
  order_sl: number;
  description?: string | null;
  is_active: number;
  row_version?: number;
}

export type CoaNodeType = 'group' | 'account';

/**
 * Unified Tree Node shape for <app-tree-view>.
 */
export interface CoaTreeNode {
  id: string;
  parent_id: string | null;
  node_type: CoaNodeType;
  code: string;
  name: string;
  raw_no: number;
  is_group: number;
  root_type?: number | null;
  normal_balance?: 'dr' | 'cr' | null;
  control_type?: number | null;
  is_postable?: number | null;
  is_active: number;
  raw_data: Account;
}

/**
 * State and logic coordinator for FIN_1001 – Unified Chart of Accounts (COA).
 * All hierarchy nodes (groups & accounts) reside in the single unified `fin_account` table.
 */
@Injectable()
export class Fin1001ModelService {
  private readonly fb = inject(FormBuilder);
  private readonly data = inject(Fin1001DataService);
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);
  private readonly formUtil = inject(FormUtilService);
  private readonly alertService = inject(AlertService);

  /** Baseline backup snapshot for change detection and diff payload creation. */
  private backupData: Record<string, any> | null = null;

  // ── Reactive State Signals ─────────────────────────────────────────────────
  readonly accounts = signal<Account[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly searchTerm = signal('');

  /** Current active selection ID (account_no). */
  readonly selectedAccountNo = signal<number | null>(null);

  /** Active node ID formatted for <app-tree-view> binding. */
  readonly selectedTreeId = computed<string | null>(() => {
    const no = this.selectedAccountNo();
    return no ? String(no) : null;
  });

  /**
   * Unified hierarchical flat dataset for <app-tree-view>.
   */
  readonly treeData = computed<Record<string, unknown>[]>(() => {
    return this.accounts().map((a) => ({
      id: String(a.account_no),
      parent_id: a.parent_account_no ? String(a.parent_account_no) : null,
      node_type: (a.is_group === 1 ? 'group' : 'account') as CoaNodeType,
      code: a.account_code || '',
      name: a.account_name || '',
      raw_no: a.account_no,
      is_group: a.is_group,
      root_type: a.root_type,
      normal_balance: a.normal_balance,
      control_type: a.control_type,
      is_postable: a.is_postable ?? (a.is_group === 1 ? 0 : 1),
      is_active: a.is_active,
      raw_data: a,
    }));
  });

  /** Options for Parent Group dropdown (accounts where is_group === 1). */
  readonly parentGroupOptions = computed(() => {
    const currentNo = this.selectedAccountNo();
    return this.accounts()
      .filter((a) => a.is_group === 1 && a.account_no !== currentNo)
      .map((a) => ({
        account_group_no: a.account_no,
        account_group_id: a.account_code,
        group_name: a.account_name,
        root_type: a.root_type,
        parent_group_no: a.parent_account_no,
      }));
  });

  /** Active Account details for display. */
  readonly currentAccount = computed<Account | null>(() => {
    const no = this.selectedAccountNo();
    if (no == null) return null;
    const targetNo = Number(no);
    return this.accounts().find((a) => Number(a.account_no) === targetNo) ?? null;
  });

  /** Checks if the currently selected node has any child accounts/groups attached to it. */
  readonly selectedHasChildren = computed<boolean>(() => {
    const no = this.selectedAccountNo();
    if (no == null) return false;
    const targetNo = Number(no);
    return this.accounts().some((a) => {
      if ((a as any).is_deleted === 1) return false;
      const pno = a.parent_account_no != null
        ? Number(a.parent_account_no)
        : (a as any).account_group_no != null && Number((a as any).account_group_no) > 0
        ? Number((a as any).account_group_no)
        : null;
      return pno != null && pno === targetNo;
    });
  });

  // ── Single Unified Reactive Form ───────────────────────────────────────────
  form!: FormGroup;

  initForms(): void {
    this.form = this.fb.group({
      account_no: [null],
      account_code: ['', [Validators.required, Validators.maxLength(30)]],
      account_name: ['', [Validators.required, Validators.maxLength(200)]],
      parent_group_no: [null],
      root_type: [1, [Validators.required]],
      normal_balance: ['dr', [Validators.required]],
      account_level: [{ value: 'Level 1 (Root)', disabled: true }],
      account_category: [null],
      sub_category: [null],
      account_class: [null],
      is_group_account: [0],
      is_postable: [1],
      is_control: [0],
      control_type: [null],
      requires_reconciliation: [0],
      requires_party: [0],
      requires_cost_center: [0],
      requires_branch: [0],
      requires_project: [0],
      requires_department: [0],
      currency_no: [1],
      order_sl: [0],
      is_active: [1],
      description: [''],
    });

    // When Root Type changes: auto-suggest Normal Balance (Asset/Expense => dr, others => cr)
    this.form.get('root_type')?.valueChanges.subscribe((rootType) => {
      if (!this.form.get('normal_balance')?.dirty) {
        const expected = rootType === 1 || rootType === 5 ? 'dr' : 'cr';
        this.form.patchValue({ normal_balance: expected }, { emitEvent: false });
      }
    });

    // When Parent Group changes: recalculate hierarchy depth level label
    this.form.get('parent_group_no')?.valueChanges.subscribe((parentNo) => {
      const isGroup = this.form.get('is_group_account')?.value === 1;
      const levelText = this.calculateLevel(parentNo, isGroup);
      this.form.patchValue({ account_level: levelText }, { emitEvent: false });
    });

    // When Is Group Account checkbox toggles: adjust posting rules & level text
    this.form.get('is_group_account')?.valueChanges.subscribe((isGroup) => {
      if (isGroup === 1) {
        this.form.patchValue({ is_postable: 0 }, { emitEvent: false });
      } else {
        this.form.patchValue({ is_postable: 1 }, { emitEvent: false });
      }
      const parentNo = this.form.get('parent_group_no')?.value;
      const levelText = this.calculateLevel(parentNo, isGroup === 1);
      this.form.patchValue({ account_level: levelText }, { emitEvent: false });
    });

    // When Control Type is AR or AP: auto-set is_control and requires_party
    this.form.get('control_type')?.valueChanges.subscribe((ct) => {
      if (ct === 1 || ct === 2) {
        this.form.patchValue({ is_control: 1, requires_party: 1 }, { emitEvent: false });
      }
    });
  }

  /** Calculates the hierarchy depth level label (e.g. Level 1, Level 2, Level 3). */
  calculateLevel(parentAccountNo?: number | null, isGroup?: boolean): string {
    if (!parentAccountNo || Number(parentAccountNo) === 0) {
      return isGroup ? 'Level 1 (Top Group)' : 'Level 1 (Top Account)';
    }
    let depth = 1;
    let currentParentId: number | null | undefined = Number(parentAccountNo);
    const visited = new Set<number>();

    while (currentParentId && !visited.has(currentParentId)) {
      visited.add(currentParentId);
      depth++;
      const parent = this.accounts().find((a) => Number(a.account_no) === currentParentId);
      currentParentId = parent?.parent_account_no != null ? Number(parent.parent_account_no) : null;
    }

    return `Level ${depth}`;
  }

  // ── Data Loading & Synchronization ─────────────────────────────────────────

  /** Loads all Chart of Accounts records. */
  loadAll(reselectAccountNo?: number | null): void {
    this.isLoading.set(true);

    this.data
      .loadAccounts()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            this.accounts.set(res.data);
          }

          // Reselect target node or fallback
          this.handleInitialSelection(reselectAccountNo);
        },
        error: () => this.toastr.error('Failed to load chart of accounts data'),
      });
  }

  private handleInitialSelection(reselectAccountNo?: number | null): void {
    if (reselectAccountNo != null) {
      const found = this.accounts().find((a) => Number(a.account_no) === Number(reselectAccountNo));
      if (found) {
        this.selectAccount(found);
        return;
      }
    }

    // Initially after reload: no node is selected in tree, and default to calling create group method
    this.onNewGroup();
  }

  /** Resets the form to a clean blank state with no active selection. */
  resetBlankForm(): void {
    this.selectedAccountNo.set(null);
    this.backupData = null;
    this.form.reset({
      account_no: null,
      account_code: '',
      account_name: '',
      parent_group_no: null,
      root_type: 1,
      normal_balance: 'dr',
      account_level: 'Level 1 (Root)',
      account_category: null,
      sub_category: null,
      account_class: null,
      is_group_account: 0,
      is_postable: 1,
      is_control: 0,
      control_type: null,
      requires_reconciliation: 0,
      requires_party: 0,
      requires_cost_center: 0,
      requires_branch: 0,
      requires_project: 0,
      requires_department: 0,
      currency_no: 1,
      order_sl: 0,
      is_active: 1,
      description: '',
    });
  }

  // ── Node Selection & Unified Patching ──────────────────────────────────────

  /** Called when a tree node is clicked in the sidebar. */
  selectNode(row: Record<string, unknown>): void {
    if (!row) return;
    const rawData = (row['raw_data'] as Account) || (row as unknown as Account);
    const accountNo = rawData?.account_no ?? row['raw_no'] ?? row['id'] ?? (row as any)['account_no'];
    if (accountNo != null) {
      const found = this.accounts().find((a) => Number(a.account_no) === Number(accountNo));
      const target = found || rawData;
      if (target && target.account_no) {
        this.selectAccount(target);
      }
    }
  }

  selectAccount(account: Account): void {
    if (!account || !account.account_no) return;
    const accNo = Number(account.account_no);
    this.selectedAccountNo.set(accNo);

    // 1. Immediately patch form with current object in state for instant UI update
    this.patchForm(account);

    // 2. Load latest details from backend in background to enrich any extra properties
    this.data.loadAccountDetail(accNo).subscribe({
      next: (res) => {
        const dtl = isSuccess(res) && res?.data ? res.data : (res as any)?.data ?? res;
        if (dtl && (dtl.account_no || dtl.account_code)) {
          this.patchForm(dtl);
        }
      },
      error: (err) => console.warn('COA detail fetch fallback to cached account', err),
    });
  }

  private patchForm(item: Account): void {
    const isGroup = item.is_group === 1;
    const parentNo = item.parent_account_no != null
      ? Number(item.parent_account_no)
      : (item as any).account_group_no != null && Number((item as any).account_group_no) > 0
      ? Number((item as any).account_group_no)
      : null;
    const levelText = this.calculateLevel(parentNo, isGroup);

    this.form.patchValue({
      account_no: item.account_no,
      account_code: item.account_code,
      account_name: item.account_name,
      parent_group_no: parentNo,
      root_type: item.root_type ?? 1,
      normal_balance: item.normal_balance ?? (item.root_type === 1 || item.root_type === 5 ? 'dr' : 'cr'),
      account_level: levelText,
      account_category: item.account_category ?? null,
      sub_category: item.sub_category ?? null,
      account_class: item.account_class ?? null,
      is_group_account: isGroup ? 1 : 0,
      is_postable: item.is_postable ?? (isGroup ? 0 : 1),
      is_control: item.is_control ?? (item.control_type ? 1 : 0),
      control_type: item.control_type ?? null,
      requires_reconciliation: item.requires_reconciliation ?? 0,
      requires_party: item.requires_party ?? 0,
      requires_cost_center: item.requires_cost_center ?? 0,
      requires_branch: item.requires_branch ?? 0,
      requires_project: item.requires_project ?? 0,
      requires_department: item.requires_department ?? 0,
      currency_no: item.currency_no ?? 1,
      order_sl: item.order_sl ?? 0,
      is_active: item.is_active ?? 1,
      description: item.description ?? '',
    });

    // Store deep copy as baseline backup snapshot for change detection & diff updating
    this.backupData = this.formUtil.clone(this.form.getRawValue());
  }

  // ── New Actions ────────────────────────────────────────────────────────────

  /** Prepares a blank Account (Ledger) creation form with contextual parent & property inheritance. */
  onNewAccount(explicitParentNo?: number | null): void {
    const selected = this.currentAccount();

    let parentNo: number | null = null;
    let rootType = 1;
    let normalBalance = 'dr';
    let accountCategory: number | null = null;
    let subCategory: number | null = null;
    let accountClass: number | null = null;

    if (explicitParentNo !== undefined && explicitParentNo !== null) {
      parentNo = Number(explicitParentNo);
      const p = this.accounts().find((a) => Number(a.account_no) === parentNo);
      if (p) {
        rootType = p.root_type ?? 1;
        normalBalance = p.normal_balance ?? (rootType === 1 || rootType === 5 ? 'dr' : 'cr');
        accountCategory = p.account_category ?? null;
        subCategory = p.sub_category ?? null;
        accountClass = p.account_class ?? null;
      }
    } else if (selected) {
      if (selected.is_group === 1) {
        // 1) Selected node HAS group flag: set selected node as the parent for new ledger
        parentNo = Number(selected.account_no);
      } else {
        // 2) Selected node has NO group flag: set its parent as new ledger's parent (sibling)
        const pno = selected.parent_account_no ?? (selected as any).account_group_no;
        parentNo = pno != null && Number(pno) > 0 ? Number(pno) : null;
      }
      rootType = selected.root_type ?? 1;
      normalBalance = selected.normal_balance ?? (rootType === 1 || rootType === 5 ? 'dr' : 'cr');
      accountCategory = selected.account_category ?? null;
      subCategory = selected.sub_category ?? null;
      accountClass = selected.account_class ?? null;
    }

    // Clear selection state and baseline backup for new record creation
    this.selectedAccountNo.set(null);
    this.backupData = null;

    const levelText = this.calculateLevel(parentNo, false);

    this.form.reset({
      account_no: null,
      account_code: '',
      account_name: '',
      parent_group_no: parentNo,
      root_type: rootType,
      normal_balance: normalBalance,
      account_level: levelText,
      account_category: accountCategory,
      sub_category: subCategory,
      account_class: accountClass,
      is_group_account: 0,
      is_postable: 1,
      is_control: 0,
      control_type: null,
      requires_reconciliation: 0,
      requires_party: 0,
      requires_cost_center: 0,
      requires_branch: 0,
      requires_project: 0,
      requires_department: 0,
      currency_no: 1,
      order_sl: 0,
      is_active: 1,
      description: '',
    });
  }

  /** Prepares a blank Account Group creation form with contextual parent & property inheritance. */
  onNewGroup(explicitParentNo?: number | null): void {
    const selected = this.currentAccount();

    let parentNo: number | null = null;
    let rootType = 1;
    let normalBalance = 'dr';

    if (explicitParentNo !== undefined && explicitParentNo !== null) {
      parentNo = Number(explicitParentNo);
      const p = this.accounts().find((a) => Number(a.account_no) === parentNo);
      if (p) {
        rootType = p.root_type ?? 1;
        normalBalance = p.normal_balance ?? (rootType === 1 || rootType === 5 ? 'dr' : 'cr');
      }
    } else if (selected) {
      if (selected.is_group === 1) {
        // Selected node HAS group flag: set selected node as parent for new sub-group
        parentNo = Number(selected.account_no);
      } else {
        // Selected node has NO group flag: set its parent as new group's parent (sibling group)
        const pno = selected.parent_account_no ?? (selected as any).account_group_no;
        parentNo = pno != null && Number(pno) > 0 ? Number(pno) : null;
      }
      rootType = selected.root_type ?? 1;
      normalBalance = selected.normal_balance ?? (rootType === 1 || rootType === 5 ? 'dr' : 'cr');
    }

    // Clear selection state and baseline backup for new group creation
    this.selectedAccountNo.set(null);
    this.backupData = null;

    const levelText = this.calculateLevel(parentNo, true);

    this.form.reset({
      account_no: null,
      account_code: '',
      account_name: '',
      parent_group_no: parentNo,
      root_type: rootType,
      normal_balance: normalBalance,
      account_level: levelText,
      account_category: null,
      sub_category: null,
      account_class: null,
      is_group_account: 1,
      is_postable: 0,
      is_control: 0,
      control_type: null,
      requires_reconciliation: 0,
      requires_party: 0,
      requires_cost_center: 0,
      requires_branch: 0,
      requires_project: 0,
      requires_department: 0,
      currency_no: 1,
      order_sl: 0,
      is_active: 1,
      description: '',
    });
  }

  // ── Save & Delete Actions ──────────────────────────────────────────────────

  /** Unified save handler: saves either group or posting account to fin_account. */
  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.get('account_code')?.invalid) {
        this.toastr.warning(this.translate.instant('accountCodeMissing') || 'Account Code is required');
      } else if (this.form.get('account_name')?.invalid) {
        this.toastr.warning(this.translate.instant('accountNameMissing') || 'Account Name is required');
      } else {
        this.toastr.warning(this.translate.instant('validationErrors') || 'Please fix form validation errors');
      }
      return;
    }

    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedAccountNo();
    const isGroup = val.is_group_account === 1;

    // Check for changes when updating an existing account
    if (isUpdate && this.backupData) {
      const hasChanges = this.formUtil.hasChanges(this.backupData, val, ['account_level']);
      if (!hasChanges) {
        this.toastr.info('No changes found');
        return;
      }
    }

    const confirmMsg = isUpdate
      ? 'Are you sure you want to update this Chart of Accounts record?'
      : 'Are you sure you want to save this new Chart of Accounts record?';
    const confirmTitle = isUpdate ? 'Update Record' : 'Save Record';

    this.alertService.confirm(confirmMsg, confirmTitle, 'primary', 'Save').subscribe((ok) => {
      if (!ok) return;
      this.executeSave(val, isUpdate, isGroup);
    });
  }

  private executeSave(val: any, isUpdate: boolean, isGroup: boolean): void {
    this.isSaving.set(true);

    const fullPayload: Partial<Account> = {
      account_no: isUpdate ? this.selectedAccountNo()! : undefined,
      account_code: val.account_code,
      account_name: val.account_name,
      parent_account_no: val.parent_group_no,
      root_type: val.root_type,
      normal_balance: val.normal_balance,
      is_group: isGroup ? 1 : 0,
      is_postable: isGroup ? 0 : (val.is_postable ?? 1),
      is_control: val.is_control ?? 0,
      control_type: val.control_type,
      account_category: val.account_category,
      sub_category: val.sub_category,
      account_class: val.account_class,
      requires_cost_center: val.requires_cost_center ?? 0,
      requires_party: val.requires_party ?? 0,
      requires_reconciliation: val.requires_reconciliation ?? 0,
      requires_branch: val.requires_branch ?? 0,
      requires_project: val.requires_project ?? 0,
      requires_department: val.requires_department ?? 0,
      currency_no: val.currency_no,
      order_sl: val.order_sl ?? 0,
      is_active: val.is_active ?? 1,
      description: val.description,
    };

    let request$;
    if (isUpdate) {
      // Send diff payload containing ONLY modified fields + primary key
      const diffPayload = this.formUtil.getDiffPayload(
        this.backupData,
        fullPayload,
        'account_no',
        ['row_version'],
        ['account_level'],
      );
      request$ = this.data.updateAccount(this.selectedAccountNo()!, diffPayload);
    } else {
      request$ = this.data.saveAccount(fullPayload);
    }

    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (res && (!res.status_code || (res.status_code >= 200 && res.status_code < 300))) {
          const successMsg = res.message || this.translate.instant(isUpdate ? 'common.updateSuccess' : 'common.saveSuccess') || 'Saved successfully';
          this.toastr.success(successMsg);
          const savedNo = isUpdate ? this.selectedAccountNo() : res.data?.account_no;
          this.loadAll(savedNo ?? null);
        } else {
          const errMsg = this.formUtil.extractErrorMessage(res, this.translate.instant('common.saveFail') || 'Save failed');
          this.toastr.error(errMsg);
        }
      },
      error: (err) => {
        const errMsg = this.formUtil.extractErrorMessage(err, this.translate.instant('common.saveFail') || 'Save failed');
        this.toastr.error(errMsg);
      },
    });
  }

  /** Deletes the active COA record. */
  onDelete(): void {
    const no = this.selectedAccountNo();
    if (!no) return;

    this.isLoading.set(true);
    this.data
      .deleteAccount(no)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res && (!res.status_code || (res.status_code >= 200 && res.status_code < 300))) {
            const successMsg = res.message || this.translate.instant('common.deleteSuccess') || 'Deleted successfully';
            this.toastr.success(successMsg);
            this.loadAll(null);
          } else {
            const errMsg = this.formUtil.extractErrorMessage(res, this.translate.instant('common.deleteFail') || 'Delete failed');
            this.toastr.error(errMsg);
          }
        },
        error: (err) => {
          const errMsg = this.formUtil.extractErrorMessage(err, this.translate.instant('common.deleteFail') || 'Delete failed');
          this.toastr.error(errMsg);
        },
      });
  }
}

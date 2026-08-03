import { Injectable, computed, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { sysApprovalDocumentTypeOptions } from '../../../../../core/constants/common-options.constants';
import { isSuccess } from '../../../../../core/models/response.model';
import { Sys1108DataService } from './data.service';

export interface ISysLookup {
  value: number;
  label: string;
}

export interface IApprovalApprover {
  approver_no?: number;
  emp_no: number;
  is_active?: number;
}

export interface IApprovalStep {
  step_no?: number;
  step_number: number;
  step_type?: number;
  next_step_no?: number | null;
  step_name: string;
  is_final?: number;
  is_active?: number;
  approver_count?: number;
  approvers: IApprovalApprover[];
}

export interface IApprovalScope {
  scope_no?: number;
  workflow_name?: string;
  branch_no?: number;
  department_no?: number;
  menu_no?: number;
  is_active?: number;
  row_version?: number;
  step_count?: number;
  steps: IApprovalStep[];
}

export interface ApprovalScope {
  __uid: number;
  scope_no?: number;
  workflow_name?: string;
  branch_no: number | null;
  department_no: number | null;
  menu_no: number | null;
  is_active: number;
  /** Server-side step count — children are not loaded for unselected rows. */
  step_count?: number;
}

export interface ApprovalStep {
  __uid: number;
  scope_uid: number;
  step_no?: number;
  step_number: number;
  step_type?: number;
  next_step_no?: number | null;
  step_name: string | null;
  is_final: number;
  is_active: number;
  /** Server-side approver count — see `ApprovalScope.step_count`. */
  approver_count?: number;
}

export interface StepApprover {
  __uid: number;
  step_uid: number;
  approver_no?: number;
  emp_no: number | null;
  is_active: number;
}

@Injectable()
export class Sys1108ModelService {
  private data = inject(Sys1108DataService);
  private toastr = inject(ToastrService);
  private translate = inject(TranslateService);
  private uidSeq = 1;

  items = signal<IApprovalScope[]>([]);
  
  branchOptions = signal<ISysLookup[]>([]);
  departmentOptions = signal<ISysLookup[]>([]);
  enrolledMenuOptions = signal<ISysLookup[]>([]);
  employeeOptions = signal<ISysLookup[]>([]);

  isLoading = signal(false);
  isSaving = signal(false);
  isDeleting = signal(false);
  searchTerm = signal('');
  
  selectedScopeUid = signal<number | null>(null);
  selectedStepUid = signal<number | null>(null);

  // ── Filters (each change re-queries the workflow list) ───────────────────
  filterBranch = signal<number | null>(null);
  filterDepartment = signal<number | null>(null);
  filterMenu = signal<number | null>(null);

  hasActiveFilters = computed(
    () => this.filterBranch() !== null || this.filterDepartment() !== null || this.filterMenu() !== null,
  );

  scopes = signal<ApprovalScope[]>([]);
  /**
   * All steps across all loaded workflows — accumulated, not replaced.
   * `currentSteps` filters this to the selected scope.
   */
  steps = signal<ApprovalStep[]>([]);
  /**
   * All approvers across all loaded steps — accumulated, not replaced.
   * `currentApprovers` filters this to the selected step.
   */
  stepApprovers = signal<StepApprover[]>([]);

  isLoadingSteps = signal(false);
  isLoadingApprovers = signal(false);

  currentSteps = computed(() => {
    const scopeUid = this.selectedScopeUid();
    if (!scopeUid) return [];
    return this.steps().filter(s => s.scope_uid === scopeUid);
  });

  currentApprovers = computed(() => {
    const stepUid = this.selectedStepUid();
    if (!stepUid) return [];
    return this.stepApprovers().filter(a => a.step_uid === stepUid);
  });

  initForm(): void {}

  loadLookups(): void {
    this.data.getBranchOptions().subscribe((res) => {
      if (isSuccess(res) && res.data) this.branchOptions.set(res.data);
    });
    this.data.getDepartmentOptions().subscribe((res) => {
      if (isSuccess(res) && res.data) this.departmentOptions.set(res.data);
    });
    this.data.getEnrolledMenuOptions().subscribe((res) => {
      if (isSuccess(res) && res.data) this.enrolledMenuOptions.set(res.data);
    });
    this.data.getEmployeeOptions().subscribe((res) => {
      if (isSuccess(res) && res.data) this.employeeOptions.set(res.data);
    });
  }

  /**
   * Loads the workflow list under the current filters and selects a row.
   *
   * @param reselectScopeNo PK to re-select after the reload (used after save, so the
   *        user stays on the row they were editing). Falls back to the first row.
   */
  loadList(reselectScopeNo?: number | null): void {
    this.isLoading.set(true);
    this.data
      .getList({
        branch_no: this.filterBranch(),
        department_no: this.filterDepartment(),
        menu_no: this.filterMenu(),
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (!isSuccess(res) || !res.data) return;
        this.items.set(res.data);
        this.rebuildArrays();

        const target = reselectScopeNo != null
          ? this.scopes().find((s) => s.scope_no === reselectScopeNo)
          : undefined;
        const first = target ?? this.scopes()[0];
        if (first) this.selectScope(first.__uid);
      });
  }

  /** Re-queries the list whenever a filter changes. */
  applyFilters(patch: Partial<{ branch: number | null; department: number | null; menu: number | null }>): void {
    if ('branch' in patch) this.filterBranch.set(patch.branch ?? null);
    if ('department' in patch) this.filterDepartment.set(patch.department ?? null);
    if ('menu' in patch) this.filterMenu.set(patch.menu ?? null);
    this.loadList();
  }

  clearFilters(): void {
    this.filterBranch.set(null);
    this.filterDepartment.set(null);
    this.filterMenu.set(null);
    this.loadList();
  }

  /**
   * Selecting a workflow loads its steps, then selects the first one.
   *
   * Steps are MERGED into the accumulated `steps` signal — existing steps for
   * other scopes are preserved so switching back doesn't lose unsaved edits.
   */
  selectScope(uid: number): void {
    if (this.selectedScopeUid() === uid) return;
    this.selectedScopeUid.set(uid);
    this.selectedStepUid.set(null);

    const scope = this.scopes().find((s) => s.__uid === uid);

    // A row that was never saved has no PK — nothing to fetch, and its steps are
    // whatever the user has added locally.
    if (!scope?.scope_no) {
      this.selectFirstStep(uid);
      return;
    }

    // If we already have steps loaded for this scope (user previously clicked it),
    // don't re-fetch — just select the first step.
    const alreadyLoaded = this.steps().some(s => s.scope_uid === uid);
    if (alreadyLoaded) {
      this.selectFirstStep(uid);
      return;
    }

    this.isLoadingSteps.set(true);
    this.data
      .getSteps(scope.scope_no)
      .pipe(finalize(() => this.isLoadingSteps.set(false)))
      .subscribe((res) => {
        if (!isSuccess(res) || !res.data) return;

        const newSteps: ApprovalStep[] = res.data.map((dto) => ({
          __uid: this.uidSeq++,
          scope_uid: uid,
          step_no: dto.step_no,
          step_number: dto.step_number,
          step_type: dto.step_type ?? 1,
          next_step_no: dto.next_step_no ?? null,
          step_name: dto.step_name ?? `Step ${dto.step_number}`,
          is_final: dto.is_final ?? 0,
          is_active: dto.is_active ?? 1,
          approver_count: dto.approver_count ?? 0,
        }));

        // Merge: keep steps for other scopes, replace for this scope
        this.steps.update(arr => [
          ...arr.filter(s => s.scope_uid !== uid),
          ...newSteps,
        ]);
        this.selectFirstStep(uid);
      });
  }

  private selectFirstStep(scopeUid: number): void {
    const first = this.steps().find((s) => s.scope_uid === scopeUid);
    if (first) this.selectStep(first.__uid);
    else this.selectedStepUid.set(null);
  }

  /**
   * Selecting a step loads its approvers.
   *
   * Approvers are MERGED into the accumulated `stepApprovers` signal — existing
   * approvers for other steps are preserved so switching back keeps unsaved edits.
   */
  selectStep(uid: number): void {
    if (this.selectedStepUid() === uid) return;
    this.selectedStepUid.set(uid);

    const step = this.steps().find((s) => s.__uid === uid);

    // New step (never saved) — its approvers are whatever the user added locally.
    if (!step?.step_no) {
      return;
    }

    // If we already have approvers loaded for this step, don't re-fetch.
    const alreadyLoaded = this.stepApprovers().some(a => a.step_uid === uid);
    if (alreadyLoaded) {
      return;
    }

    this.isLoadingApprovers.set(true);
    this.data
      .getApprovers(step.step_no)
      .pipe(finalize(() => this.isLoadingApprovers.set(false)))
      .subscribe((res) => {
        if (!isSuccess(res) || !res.data) return;

        const newApprovers: StepApprover[] = res.data.map((dto) => ({
          __uid: this.uidSeq++,
          step_uid: uid,
          approver_no: dto.approver_no,
          emp_no: dto.emp_no,
          is_active: dto.is_active ?? 1,
        }));

        // Merge: keep approvers for other steps, replace for this step
        this.stepApprovers.update(arr => [
          ...arr.filter(a => a.step_uid !== uid),
          ...newApprovers,
        ]);
      });
  }

  /**
   * Rebuilds the workflow rows from the list payload.
   *
   * Steps and approvers are NOT built here — the list endpoint returns scope rows only
   * and children load per selection. Selection is left to `loadList`, which knows
   * whether to restore a row (after save) or fall back to the first.
   */
  private rebuildArrays(): void {
    this.steps.set([]);
    this.stepApprovers.set([]);
    this.selectedScopeUid.set(null);
    this.selectedStepUid.set(null);

    this.scopes.set(
      this.items().map((scopeDto) => ({
        __uid: this.uidSeq++,
        scope_no: scopeDto.scope_no,
        workflow_name: scopeDto.workflow_name,
        branch_no: scopeDto.branch_no ?? null,
        department_no: scopeDto.department_no ?? null,
        menu_no: scopeDto.menu_no ?? null,
        is_active: scopeDto.is_active ?? 1,
        step_count: scopeDto.step_count ?? 0,
      })),
    );
  }

  addScopeRow(): number {
    const scopeUid = this.uidSeq++;

    this.scopes.update(arr => [...arr, {
      __uid: scopeUid,
      branch_no: null,
      department_no: null,
      menu_no: null,
      is_active: 1
    }]);
    
    this.selectScope(scopeUid);
    return scopeUid;
  }

  updateScope(uid: number, data: Partial<ApprovalScope>): void {
    this.scopes.update(arr => arr.map(s => s.__uid === uid ? { ...s, ...data } : s));
  }

  /**
   * Removes a workflow row from the grid locally. Does NOT call the API.
   * Also cascades: removes all child steps and their approvers from local state.
   */
  removeScope(uid: number): void {
    // Cascade: collect step uids for this scope, then remove their approvers too
    const stepUids = this.steps().filter(s => s.scope_uid === uid).map(s => s.__uid);
    this.stepApprovers.update(arr => arr.filter(a => !stepUids.includes(a.step_uid)));
    this.steps.update(arr => arr.filter(s => s.scope_uid !== uid));
    this.scopes.update(arr => arr.filter(s => s.__uid !== uid));

    // Re-select after removal
    if (this.selectedScopeUid() === uid) {
      const remaining = this.scopes();
      if (remaining.length > 0) {
        this.selectedScopeUid.set(null); // reset so selectScope doesn't short-circuit
        this.selectScope(remaining[0].__uid);
      } else {
        this.selectedScopeUid.set(null);
        this.selectedStepUid.set(null);
      }
    }
  }

  /**
   * Deletes the selected workflow from the server (page-level Delete button).
   * Only works for persisted rows (with `scope_no`). New rows are just removed locally.
   */
  deleteScope(): void {
    const scopeUid = this.selectedScopeUid();
    if (!scopeUid) return;

    const scope = this.scopes().find(s => s.__uid === scopeUid);
    if (!scope) return;

    if (!scope.scope_no) {
      // Never saved — just remove locally
      this.removeScope(scopeUid);
      this.toastr.success(this.translate.instant('common.deleteSuccess'));
      return;
    }

    this.isDeleting.set(true);
    this.data.delete(scope.scope_no)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe(res => {
        if (isSuccess(res)) {
          this.toastr.success(res.message || this.translate.instant('common.deleteSuccess'));
          this.removeScope(scopeUid);
        }
      });
  }

  addStepRow(scopeUid?: number): number | null {
    const sUid = scopeUid ?? this.selectedScopeUid();
    if (!sUid) return null;
    
    const existingSteps = this.steps().filter(s => s.scope_uid === sUid);
    const nextStep = existingSteps.length > 0 ? Math.max(...existingSteps.map(s => s.step_number)) + 1 : 1;
    const stepUid = this.uidSeq++;

    this.steps.update(arr => [...arr, {
      __uid: stepUid,
      scope_uid: sUid,
      step_number: nextStep,
      step_type: 1,
      next_step_no: null,
      step_name: `Step ${nextStep}`,
      is_final: 0,
      is_active: 1,
    }]);

    this.selectStep(stepUid);
    return stepUid;
  }

  updateStep(uid: number, data: Partial<ApprovalStep>): void {
    this.steps.update(arr => arr.map(s => s.__uid === uid ? { ...s, ...data } : s));
  }

  /**
   * Removes a step row locally. Also cascades: removes all child approvers.
   */
  removeStep(uid: number): void {
    const step = this.steps().find(s => s.__uid === uid);
    if (!step) return;
    const sUid = step.scope_uid;

    // Cascade: remove child approvers
    this.stepApprovers.update(arr => arr.filter(a => a.step_uid !== uid));
    this.steps.update(arr => arr.filter(s => s.__uid !== uid));
    
    if (this.selectedStepUid() === uid) {
      const remainingSteps = this.steps().filter(s => s.scope_uid === sUid);
      if (remainingSteps.length > 0) {
        this.selectedStepUid.set(null); // reset so selectStep doesn't short-circuit
        this.selectStep(remainingSteps[0].__uid);
      } else {
        this.selectedStepUid.set(null);
      }
    }
  }

  addStepApproverRow(stepUid?: number): number | null {
    const sUid = stepUid ?? this.selectedStepUid();
    if (!sUid) return null;

    const approverUid = this.uidSeq++;
    this.stepApprovers.update(arr => [...arr, {
      __uid: approverUid,
      step_uid: sUid,
      emp_no: null,
      is_active: 1
    }]);
    return approverUid;
  }

  updateStepApprover(uid: number, data: Partial<StepApprover>): void {
    this.stepApprovers.update(arr => arr.map(a => a.__uid === uid ? { ...a, ...data } : a));
  }

  removeStepApprover(uid: number): void {
    this.stepApprovers.update(arr => arr.filter(a => a.__uid !== uid));
  }

  onSave(): void {
    const scopeUid = this.selectedScopeUid();
    if (!scopeUid) return;

    const scope = this.scopes().find(s => s.__uid === scopeUid);
    if (!scope) return;
    
    if (!scope.menu_no) {
      this.toastr.error('Enrolled Menu is required');
      return;
    }

    const payload: Partial<IApprovalScope> = {
      scope_no: scope.scope_no,
      workflow_name: scope.workflow_name,
      branch_no: scope.branch_no ?? undefined,
      department_no: scope.department_no ?? undefined,
      menu_no: scope.menu_no ?? undefined,
      is_active: scope.is_active,
      steps: this.steps().filter(s => s.scope_uid === scopeUid).map(s => ({
        step_no: s.step_no,
        step_number: s.step_number,
        step_type: s.step_type,
        next_step_no: s.next_step_no,
        step_name: s.step_name || `Step ${s.step_number}`,
        is_final: s.is_final ? 1 : 0,
        is_active: s.is_active,
        approvers: this.stepApprovers().filter(a => a.step_uid === s.__uid).map(a => ({
          approver_no: a.approver_no,
          emp_no: a.emp_no!,
          is_active: a.is_active
        })).filter(a => !!a.emp_no)
      }))
    };

    this.isSaving.set(true);
    this.data.save(payload).pipe(finalize(() => this.isSaving.set(false))).subscribe(res => {
      if (isSuccess(res)) {
        this.toastr.success(res.message || this.translate.instant('common.saveSuccess'));
        // Reload for server-assigned ids, then land back on the row just saved —
        // a new workflow keeps the PK the server returned.
        this.loadList(res.data?.scope_no ?? scope.scope_no ?? null);
      }
    });
  }
}

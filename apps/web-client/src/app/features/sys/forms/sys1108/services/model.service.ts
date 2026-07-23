import { Injectable, computed, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
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
  private uidSeq = 1;

  items = signal<IApprovalScope[]>([]);
  
  branchOptions = signal<ISysLookup[]>([]);
  departmentOptions = signal<ISysLookup[]>([]);
  enrolledMenuOptions = signal<ISysLookup[]>([]);
  employeeOptions = signal<ISysLookup[]>([]);

  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');
  
  selectedScopeUid = signal<number | null>(null);
  selectedStepUid = signal<number | null>(null);

  scopes = signal<ApprovalScope[]>([]);
  steps = signal<ApprovalStep[]>([]);
  stepApprovers = signal<StepApprover[]>([]);

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

  loadList(): void {
    this.isLoading.set(true);
    this.data
      .getList()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) {
          this.items.set(res.data);
          this.rebuildArrays();
        }
      });
  }

  selectScope(uid: number): void {
    this.selectedScopeUid.set(uid);
    
    // Auto-select first step if steps exist
    const childSteps = this.steps().filter(s => s.scope_uid === uid);
    if (childSteps.length > 0) {
      this.selectedStepUid.set(childSteps[0].__uid);
    } else {
      this.selectedStepUid.set(null);
    }
  }

  selectStep(uid: number): void {
    this.selectedStepUid.set(uid);
  }

  private rebuildArrays(): void {
    this.scopes.set([]);
    this.steps.set([]);
    this.stepApprovers.set([]);
    this.selectedScopeUid.set(null);
    this.selectedStepUid.set(null);

    const scopesList = this.items();
    if (scopesList.length === 0) return;

    const newScopes: ApprovalScope[] = [];
    const newSteps: ApprovalStep[] = [];
    const newApprovers: StepApprover[] = [];

    scopesList.forEach(scopeDto => {
      const scopeUid = this.uidSeq++;
      newScopes.push({
        __uid: scopeUid,
        scope_no: scopeDto.scope_no,
        workflow_name: scopeDto.workflow_name,
        branch_no: scopeDto.branch_no ?? null,
        department_no: scopeDto.department_no ?? null,
        menu_no: scopeDto.menu_no ?? null,
        is_active: scopeDto.is_active ?? 1
      });

      scopeDto.steps?.forEach(stepDto => {
        const stepUid = this.uidSeq++;
        newSteps.push({
          __uid: stepUid,
          scope_uid: scopeUid,
          step_no: stepDto.step_no,
          step_number: stepDto.step_number,
          step_type: stepDto.step_type ?? 1,
          next_step_no: stepDto.next_step_no ?? null,
          step_name: stepDto.step_name ?? `Step ${stepDto.step_number}`,
          is_final: stepDto.is_final ?? 0,
          is_active: stepDto.is_active ?? 1
        });

        stepDto.approvers?.forEach(appDto => {
          newApprovers.push({
            __uid: this.uidSeq++,
            step_uid: stepUid,
            approver_no: appDto.approver_no,
            emp_no: appDto.emp_no,
            is_active: appDto.is_active ?? 1
          });
        });
      });
    });

    this.scopes.set(newScopes);
    this.steps.set(newSteps);
    this.stepApprovers.set(newApprovers);

    if (newScopes.length > 0) {
      this.selectScope(newScopes[0].__uid);
    }
  }

  addScopeRow(): void {
    const scopeUid = this.uidSeq++;

    this.scopes.update(arr => [...arr, {
      __uid: scopeUid,
      branch_no: null,
      department_no: null,
      menu_no: null,
      is_active: 1
    }]);
    
    this.selectScope(scopeUid);
  }

  updateScope(uid: number, data: Partial<ApprovalScope>): void {
    this.scopes.update(arr => arr.map(s => s.__uid === uid ? { ...s, ...data } : s));
  }

  removeScope(uid: number): void {
    const hasSteps = this.steps().some(s => s.scope_uid === uid);
    if (hasSteps) {
      this.toastr.warning('Cannot delete Approval Scope because it has child Steps.');
      return;
    }

    const scope = this.scopes().find(s => s.__uid === uid);
    if (scope?.scope_no) {
      // Call backend to delete
      this.data.delete(scope.scope_no).subscribe(res => {
        if (isSuccess(res)) {
          this.toastr.success('Scope deleted from server');
          this.scopes.update(arr => arr.filter(s => s.__uid !== uid));
        }
      });
    } else {
      this.scopes.update(arr => arr.filter(s => s.__uid !== uid));
    }
    
    if (this.selectedScopeUid() === uid) {
      const remaining = this.scopes();
      if (remaining.length > 0) {
        this.selectScope(remaining[0].__uid);
      } else {
        this.selectedScopeUid.set(null);
        this.selectedStepUid.set(null);
      }
    }
  }

  addStepRow(scopeUid?: number): void {
    const sUid = scopeUid ?? this.selectedScopeUid();
    if (!sUid) return;
    
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
  }

  updateStep(uid: number, data: Partial<ApprovalStep>): void {
    this.steps.update(arr => arr.map(s => s.__uid === uid ? { ...s, ...data } : s));
  }

  removeStep(uid: number): void {
    const step = this.steps().find(s => s.__uid === uid);
    if (!step) return;
    const sUid = step.scope_uid;

    const hasApprovers = this.stepApprovers().some(a => a.step_uid === uid);
    if (hasApprovers) {
      this.toastr.warning('Cannot delete Step because it has child Approvers.');
      return;
    }

    this.steps.update(arr => arr.filter(s => s.__uid !== uid));
    
    if (this.selectedStepUid() === uid) {
      const remainingSteps = this.steps().filter(s => s.scope_uid === sUid);
      if (remainingSteps.length > 0) {
        this.selectStep(remainingSteps[0].__uid);
      } else {
        this.selectedStepUid.set(null);
      }
    }
  }

  addStepApproverRow(stepUid?: number): void {
    const sUid = stepUid ?? this.selectedStepUid();
    if (!sUid) return;

    this.stepApprovers.update(arr => [...arr, {
      __uid: this.uidSeq++,
      step_uid: sUid,
      emp_no: null,
      is_active: 1
    }]);
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
        this.toastr.success('Approval scope saved successfully');
        this.loadList(); // reload to get IDs
      }
    });
  }
}

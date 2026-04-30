import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
  FormArray,
} from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { sysConstants } from '../../constants/sys.constants';
import { SysDataService } from '../../services/data.service';
import { FormPermissionService } from 'apps/web-client/src/app/core/services/form-permission.service';
import { finalize } from 'rxjs';
import { AlertService } from 'apps/web-client/src/app/core/services/alert.service';

interface FinancialYearPeriod {
  period_no?: number;
  period_code: string;
  period_name: string;
  start_date: string;
  end_date: string;
  status: 'Open' | 'Closed' | 'Locked';
}

interface FinancialYear {
  fin_year_no: number;
  fin_year_code: string;
  fin_year_name: string;
  start_date: string;
  end_date: string;
  status: 'Open' | 'Closed' | 'Locked';
  is_current: boolean;
  periods: FinancialYearPeriod[];
}

@Component({
  selector: 'app-sys1003',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule],
  providers: [DatePipe],
  templateUrl: './sys1003.component.html',
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .periods-table-container {
        max-height: 400px;
        overflow-y: auto;
      }
    `,
  ],
})
export class Sys1003Component implements OnInit {
  private fb = inject(FormBuilder);
  private sysService = inject(SysDataService);
  private datePipe = inject(DatePipe);
  private alertService = inject(AlertService);
  public permissionService = inject(FormPermissionService);

  readonly SYS_CONSTS = sysConstants;

  // Data signals
  financialYears = signal<FinancialYear[]>([]);
  branches = signal<any[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);

  searchTerm = signal('');
  selectedYearNo = signal<number | null>(null);
  lastSelectedIndex: number = 0;

  // Computed signal for filtered list
  filteredYears = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.financialYears().filter((y) =>
      y.fin_year_name.toLowerCase().includes(term) || 
      y.fin_year_code.toLowerCase().includes(term)
    );
  });

  formdata: FormGroup = this.fb.group({
    fin_year_no: [null],
    fin_year_code: ['', [Validators.required, Validators.maxLength(20)]],
    fin_year_name: ['', [Validators.required]],
    branch_nos: [[], [Validators.required]],
    start_date: ['', [Validators.required]],
    end_date: ['', [Validators.required]],
    status: ['Open', [Validators.required]],
    is_current: [false],
    periods: this.fb.array([])
  });

  get periodsFormArray() {
    return this.formdata.get('periods') as FormArray;
  }

  ngOnInit(): void {
    this.permissionService.loadPermissions('SYS_1003').subscribe();
    this.loadBranches();
    this.loadFinancialYears();
  }

  loadBranches() {
    this.sysService.getList<any>('branch/list').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.branches.set(res.data);
        }
      }
    });
  }

  loadFinancialYears(reselectIndex?: number) {
    this.isLoading.set(true);
    this.sysService.getList<any>('finyear/list')
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.financialYears.set(res.data);
            if (res.data.length > 0) {
              const index = (reselectIndex !== undefined && reselectIndex < res.data.length) ? reselectIndex : 0;
              this.selectYear(res.data[index], index);
            } else {
              this.onNew();
            }
          }
        },
        error: (err) => {
          this.alertService.error('Failed to load financial years');
          console.error(err);
        }
      });
  }

  selectYear(year: any, index?: number) {
    if (index !== undefined) this.lastSelectedIndex = index;
    
    this.selectedYearNo.set(year.fin_year_no);
    this.isLoading.set(true);

    this.sysService.getDetails<any>('finyear/detail', { fin_year_no: year.fin_year_no })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.periodsFormArray.clear();
            
            this.formdata.patchValue({
              fin_year_no: res.data.finYearNo,
              fin_year_code: res.data.finYearCode,
              fin_year_name: res.data.finYearName,
              branch_nos: res.data.branchNos || [],
              start_date: this.datePipe.transform(res.data.startDate, 'yyyy-MM-dd'),
              end_date: this.datePipe.transform(res.data.endDate, 'yyyy-MM-dd'),
              status: res.data.status,
              is_current: res.data.isCurrent === 1 || res.data.isCurrent === true
            });
            
            if (res.data.periods && res.data.periods.length > 0) {
              res.data.periods.forEach((p: any) => {
                this.addPeriodRow({
                  period_no: p.periodNo,
                  period_code: p.periodCode,
                  period_name: p.periodName,
                  start_date: this.datePipe.transform(p.startDate, 'yyyy-MM-dd')!,
                  end_date: this.datePipe.transform(p.endDate, 'yyyy-MM-dd')!,
                  status: p.status
                });
              });
            }
          }
        },
        error: (err) => {
          this.alertService.error('Failed to get details');
          console.error(err);
        }
      });
  }

  addPeriodRow(period?: FinancialYearPeriod) {
    const group = this.fb.group({
      period_no: [period?.period_no || null],
      period_code: [period?.period_code || '', Validators.required],
      period_name: [period?.period_name || '', Validators.required],
      start_date: [period?.start_date || '', Validators.required],
      end_date: [period?.end_date || '', Validators.required],
      status: [period?.status || 'Open', Validators.required]
    });
    this.periodsFormArray.push(group);
  }

  autoGeneratePeriods() {
    const startDateStr = this.formdata.get('start_date')?.value;
    const endDateStr = this.formdata.get('end_date')?.value;
    
    if (!startDateStr || !endDateStr) {
      this.alertService.warning('Please select start and end dates first.');
      return;
    }

    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    this.periodsFormArray.clear();
    
    for (let i = 0; i < 12; i++) {
      const pStart = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const pEnd = new Date(start.getFullYear(), start.getMonth() + i + 1, 0);
      
      if (pStart > end) break;
      
      const monthName = pStart.toLocaleString('default', { month: 'long' });
      const year = pStart.getFullYear();
      
      this.addPeriodRow({
        period_code: `${monthName.substring(0, 3).toUpperCase()}-${year}`,
        period_name: `${monthName} ${year}`,
        start_date: pStart.toISOString().split('T')[0],
        end_date: (pEnd > end ? end : pEnd).toISOString().split('T')[0],
        status: 'Open'
      });
    }
    this.alertService.info('Accounting periods generated.');
  }

  onNew() {
    this.selectedYearNo.set(null);
    this.formdata.reset({ status: 'Open', is_current: false });
    this.periodsFormArray.clear();
  }

  onSave() {
    if (this.formdata.invalid) {
      this.formdata.markAllAsTouched();
      this.alertService.warning('Please fill all required fields correctly.');
      return;
    }

    this.isSaving.set(true);
    const val = this.formdata.value;
    
    const payload = {
      fin_year_no: this.selectedYearNo(),
      fin_year_code: val.fin_year_code,
      fin_year_name: val.fin_year_name,
      branch_nos: val.branch_nos,
      start_date: val.start_date,
      end_date: val.end_date,
      status: val.status,
      is_current: val.is_current ? 1 : 0,
      periods: val.periods.map((p: any) => ({
        period_no: p.period_no,
        period_code: p.period_code,
        period_name: p.period_name,
        start_date: p.start_date,
        end_date: p.end_date,
        status: p.status
      }))
    };

    const isUpdate = !!this.selectedYearNo();
    const obs = isUpdate 
      ? this.sysService.update<any>('finyear/update', payload)
      : this.sysService.create<any>('finyear/create', payload);

    obs.pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.alertService.success(isUpdate ? 'Financial Year updated' : 'Financial Year created');
            this.loadFinancialYears(isUpdate ? this.lastSelectedIndex : 0);
          } else {
            this.alertService.error(res.message || 'Save failed');
          }
        },
        error: (err) => {
          this.alertService.error('API Error during save');
          console.error(err);
        }
      });
  }

  onReset() {
    if (this.selectedYearNo()) {
      const original = this.financialYears().find(
        (y) => y.fin_year_no === this.selectedYearNo(),
      );
      if (original) this.selectYear(original);
    } else {
      this.onNew();
    }
  }

  onDelete() {
    if (!this.selectedYearNo()) return;

    this.alertService.deleteConfirm().subscribe(confirmed => {
      if (confirmed) {
        this.isLoading.set(true);
        this.sysService.delete<any>('finyear/delete', { fin_year_no: this.selectedYearNo() })
          .pipe(finalize(() => this.isLoading.set(false)))
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.alertService.success('Financial Year deleted');
                this.loadFinancialYears();
              } else {
                this.alertService.error(res.message || 'Delete failed');
              }
            },
            error: (err) => {
              this.alertService.error('API Error during delete');
              console.error(err);
            }
          });
      }
    });
  }

  onCloseFY() {
    if (this.selectedYearNo()) {
      this.alertService.confirm('WARNING: Closing the Financial Year will lock all transactions. Proceed?', 'Close Fiscal Year', 'warn').subscribe(confirmed => {
        if (confirmed) {
          this.formdata.patchValue({ status: 'Closed' });
          this.onSave();
        }
      });
    }
  }
}

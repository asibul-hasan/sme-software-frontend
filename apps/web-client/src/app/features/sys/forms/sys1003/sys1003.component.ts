import { Component, OnInit, inject } from '@angular/core';
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
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { sysConstants } from '../../constants/sys.constants';
import {
  Sys1003ModelService,
  FinancialYear,
  FinancialYearPeriod,
} from './services/model.service';
import { SysDataService } from '../../services/data.service';
import { FormPermissionService } from 'apps/web-client/src/app/core/services/form-permission.service';
import { finalize } from 'rxjs';
import { AlertService } from 'apps/web-client/src/app/core/services/alert.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-sys1003',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    PageFormLayoutComponent,
  ],
  providers: [DatePipe, Sys1003ModelService],
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
  public model = inject(Sys1003ModelService);
  private fb = inject(FormBuilder);
  private sysService = inject(SysDataService);
  private datePipe = inject(DatePipe);
  private alertService = inject(AlertService);
  private toastr = inject(ToastrService);
  public permissionService = inject(FormPermissionService);

  readonly sysConstants = sysConstants;
  readonly SYS_CONSTS = sysConstants;

  onSearchTermChange(val: string) {
    this.model.searchTerm.set(val);
  }

  formdata: FormGroup = this.fb.group({
    fin_year_no: [null],
    fin_year_code: ['', [Validators.required, Validators.maxLength(20)]],
    fin_year_name: ['', [Validators.required]],
    branch_nos: [[], [Validators.required]],
    start_date: ['', [Validators.required]],
    end_date: ['', [Validators.required]],
    status: ['Open', [Validators.required]],
    is_current: [false],
    periods: this.fb.array([]),
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
          this.model.branches.set(res.data);
        }
      },
    });
  }

  loadFinancialYears(reselectIndex?: number) {
    this.model.isLoading.set(true);
    this.sysService
      .getList<any>('finyear/list')
      .pipe(finalize(() => this.model.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.model.financialYears.set(res.data);
            if (res.data.length > 0) {
              const index =
                reselectIndex !== undefined && reselectIndex < res.data.length
                  ? reselectIndex
                  : 0;
              this.selectYear(res.data[index], index);
            } else {
              this.onNew();
            }
          }
        },
        error: (err) => {
          this.toastr.error('Failed to load financial years');
          console.error(err);
        },
      });
  }

  selectYear(year: any, index?: number) {
    if (index !== undefined) this.model.lastSelectedIndex = index;

    this.model.selectedYearNo.set(year.fin_year_no);
    this.model.isLoading.set(true);

    this.sysService
      .getDetails<any>('finyear/detail', { fin_year_no: year.fin_year_no })
      .pipe(finalize(() => this.model.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.periodsFormArray.clear();

            this.formdata.patchValue({
              fin_year_no: res.data.finYearNo,
              fin_year_code: res.data.finYearCode,
              fin_year_name: res.data.finYearName,
              branch_nos: res.data.branchNos || [],
              start_date: this.datePipe.transform(
                res.data.startDate,
                'yyyy-MM-dd',
              ),
              end_date: this.datePipe.transform(res.data.endDate, 'yyyy-MM-dd'),
              status: res.data.status,
              is_current:
                res.data.isCurrent === 1 || res.data.isCurrent === true,
            });

            if (res.data.periods && res.data.periods.length > 0) {
              res.data.periods.forEach((p: any) => {
                this.addPeriodRow({
                  period_no: p.periodNo,
                  period_code: p.periodCode,
                  period_name: p.periodName,
                  start_date: this.datePipe.transform(
                    p.startDate,
                    'yyyy-MM-dd',
                  )!,
                  end_date: this.datePipe.transform(p.endDate, 'yyyy-MM-dd')!,
                  status: p.status,
                });
              });
            }
          }
        },
        error: (err) => {
          this.toastr.error('Failed to get details');
          console.error(err);
        },
      });
  }

  addPeriodRow(period?: FinancialYearPeriod) {
    const group = this.fb.group({
      period_no: [period?.period_no || null],
      period_code: [period?.period_code || '', Validators.required],
      period_name: [period?.period_name || '', Validators.required],
      start_date: [period?.start_date || '', Validators.required],
      end_date: [period?.end_date || '', Validators.required],
      status: [period?.status || 'Open', Validators.required],
    });
    this.periodsFormArray.push(group);
  }

  autoGeneratePeriods() {
    const startDateStr = this.formdata.get('start_date')?.value;
    const endDateStr = this.formdata.get('end_date')?.value;

    if (!startDateStr || !endDateStr) {
      this.toastr.warning('Please select start and end dates first.');
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
        status: 'Open',
      });
    }
    this.toastr.info('Accounting periods generated.');
  }

  onNew() {
    this.model.selectedYearNo.set(null);
    this.formdata.reset({ status: 'Open', is_current: false });
    this.periodsFormArray.clear();
  }

  onSave() {
    if (this.formdata.invalid) {
      this.formdata.markAllAsTouched();
      this.toastr.warning('Please fill all required fields correctly.');
      return;
    }

    this.model.isSaving.set(true);
    const val = this.formdata.value;

    const payload = {
      fin_year_no: this.model.selectedYearNo(),
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
        status: p.status,
      })),
    };

    const isUpdate = !!this.model.selectedYearNo();
    const obs = isUpdate
      ? this.sysService.update<any>('finyear/update', payload)
      : this.sysService.create<any>('finyear/create', payload);

    obs.pipe(finalize(() => this.model.isSaving.set(false))).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success(
            isUpdate ? 'Financial Year updated' : 'Financial Year created',
          );
          this.loadFinancialYears(isUpdate ? this.model.lastSelectedIndex : 0);
        } else {
          this.toastr.error(res.message || 'Save failed');
        }
      },
      error: (err) => {
        this.toastr.error('API Error during save');
        console.error(err);
      },
    });
  }

  onReset() {
    if (this.model.selectedYearNo()) {
      const original = this.model
        .financialYears()
        .find((y) => y.fin_year_no === this.model.selectedYearNo());
      if (original) this.selectYear(original);
    } else {
      this.onNew();
    }
  }

  onDelete() {
    if (!this.model.selectedYearNo()) return;

    this.alertService.deleteConfirm().subscribe((confirmed) => {
      if (confirmed) {
        this.model.isLoading.set(true);
        this.sysService
          .delete<any>('finyear/delete', {
            fin_year_no: this.model.selectedYearNo(),
          })
          .pipe(finalize(() => this.model.isLoading.set(false)))
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.toastr.success('Financial Year deleted');
                this.loadFinancialYears();
              } else {
                this.toastr.error(res.message || 'Delete failed');
              }
            },
            error: (err) => {
              this.toastr.error('API Error during delete');
              console.error(err);
            },
          });
      }
    });
  }

  onCloseFY() {
    if (this.model.selectedYearNo()) {
      this.alertService
        .confirm(
          'WARNING: Closing the Financial Year will lock all transactions. Proceed?',
          'Close Fiscal Year',
          'warn',
        )
        .subscribe((confirmed) => {
          if (confirmed) {
            this.formdata.patchValue({ status: 'Closed' });
            this.onSave();
          }
        });
    }
  }
}

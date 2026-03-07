
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedModule } from '../../../../../shared/shared.module';
import { EmployeeService } from '../../services/employee.service';
import { CreateEmployeeDto, Employee } from '../../models/employee.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-employee-create',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './employee-create.component.html',
  styleUrls: ['./employee-create.component.scss']
})
export class EmployeeCreateComponent implements OnInit {
  employeeForm!: FormGroup;
  isEditMode = false;
  employeeId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.route.params.subscribe(params => {
        if (params['id']) {
            this.isEditMode = true;
            this.employeeId = params['id'];
            this.loadEmployeeData(this.employeeId!);
        }
    });
  }

  loadEmployeeData(id: string) {
      this.employeeService.findOne(id).subscribe({
          next: (employee) => {
              this.patchForm(employee);
          },
          error: (err) => {
              this.snackBar.open('Failed to load employee data', 'Close', { duration: 3000 });
              this.router.navigate(['../list'], { relativeTo: this.route });
          }
      });
  }
  
  patchForm(employee: Employee) {
      this.employeeForm.patchValue({
          personalInfo: {
              full_name: employee.full_name,
              father_name: employee.father_name,
              mother_name: employee.mother_name,
              dob: employee.dob,
              gender: employee.gender,
              blood_group: employee.blood_group,
              nid: employee.nid,
              passport_no: employee.passport_no,
              marital_status: employee.marital_status,
              religion: employee.religion,
              photo_url: employee.photo_url
          },
          contactInfo: {
              present_address: employee.present_address,
              permanent_address: employee.permanent_address,
              mobile: employee.mobile,
              emergency_contact: employee.emergency_contact,
              email: employee.email
          },
          employmentInfo: {
              designation_id: employee.designation_id,
              department_id: employee.department_id,
              branch_ids: employee.branch_ids,
              primary_branch_id: employee.primary_branch_id,
              join_date: employee.join_date,
              employment_type: employee.employment_type,
              reporting_manager_id: employee.reporting_manager_id,
              status: employee.status
          },
          bankInfo: {
              bank_name: employee.bank_name,
              bank_branch: employee.bank_branch,
              account_number: employee.account_number,
              account_holder_name: employee.account_holder_name,
              routing_number: employee.routing_number
          },
          salaryInfo: {
              basic_salary: employee.basic_salary,
              house_rent: employee.house_rent,
              medical_allowance: employee.medical_allowance,
              conveyance_allowance: employee.conveyance_allowance,
              other_allowance: employee.other_allowance
          }
      });
  }

  initForm() {
    this.employeeForm = this.fb.group({
      // Personal Info
      personalInfo: this.fb.group({
        full_name: ['', Validators.required],
        father_name: [''],
        mother_name: [''],
        dob: [''],
        gender: [''],
        blood_group: [''],
        nid: [''],
        passport_no: [''],
        marital_status: [''],
        religion: [''],
        photo_url: ['']
      }),

      // Contact Info
      contactInfo: this.fb.group({
        present_address: [''],
        permanent_address: [''],
        mobile: ['', Validators.required],
        emergency_contact: [''],
        email: ['', [Validators.email]]
      }),

      // Employment Info
      employmentInfo: this.fb.group({
        designation_id: ['', Validators.required],
        department_id: ['', Validators.required],
        branch_ids: [[]],
        primary_branch_id: ['', Validators.required],
        join_date: ['', Validators.required],
        employment_type: ['Permanent'],
        reporting_manager_id: [''],
        status: ['Active']
      }),

      // Bank Info
      bankInfo: this.fb.group({
        bank_name: [''],
        bank_branch: [''],
        account_number: [''],
        account_holder_name: [''],
        routing_number: ['']
      }),

      // Salary Info
      salaryInfo: this.fb.group({
        basic_salary: [0],
        house_rent: [0],
        medical_allowance: [0],
        conveyance_allowance: [0],
        other_allowance: [0],
        gross_salary: [{value: 0, disabled: true}]
      }),
      
      // Login Credentials (Optional)
      loginInfo: this.fb.group({
          create_user: [false],
          username: [''],
          password: [''],
          role_id: ['']
      })
    });
    
    // Auto-calculate Gross Salary
    this.setupSalaryCalculation();
  }

  setupSalaryCalculation() {
      const salaryGroup = this.employeeForm.get('salaryInfo') as FormGroup;
      salaryGroup.valueChanges.subscribe(vals => {
          const total = (vals.basic_salary || 0) + 
                        (vals.house_rent || 0) + 
                        (vals.medical_allowance || 0) + 
                        (vals.conveyance_allowance || 0) + 
                        (vals.other_allowance || 0);
          
          // Use emitEvent: false to avoid infinite loop if we triggered valueChanges again
          if (salaryGroup.get('gross_salary')?.value !== total) {
              salaryGroup.get('gross_salary')?.setValue(total, { emitEvent: false });
          }
      });
  }

  onSubmit() {
    if (this.employeeForm.valid) {
      const formValue = this.employeeForm.getRawValue();
      const payload: CreateEmployeeDto = {
          ...formValue.personalInfo,
          ...formValue.contactInfo,
          ...formValue.employmentInfo,
          ...formValue.bankInfo,
          ...formValue.salaryInfo,
          // Extract login info if create_user is checked
          create_user: formValue.loginInfo.create_user,
          username: formValue.loginInfo.username,
          password: formValue.loginInfo.password,
          role_id: formValue.loginInfo.role_id
      };
      
      const request$ = this.isEditMode && this.employeeId
            ? this.employeeService.update(this.employeeId, payload)
            : this.employeeService.create(payload);
            
      request$.subscribe({
          next: () => {
              this.snackBar.open(this.isEditMode ? 'Employee updated' : 'Employee created', 'Close', { duration: 3000 });
              this.router.navigate(['../list'], { relativeTo: this.route });
          },
          error: (err) => {
              console.error(err);
              this.snackBar.open('Error saving employee', 'Close', { duration: 3000 });
          }
      });

    } else {
        this.employeeForm.markAllAsTouched();
    }
  }
}

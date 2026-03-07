
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SharedModule } from '../../../../../shared/shared.module';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../models/employee.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './employee-detail.component.html',
  styleUrls: ['./employee-detail.component.scss']
})
export class EmployeeDetailComponent implements OnInit {
  employeeId: string | null = null;
  employee: Employee | null = null;
  isLoading = true;

  constructor(
      private route: ActivatedRoute,
      private employeeService: EmployeeService,
      private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.employeeId = params['id'];
      if (this.employeeId) {
          this.loadEmployeeData(this.employeeId);
      }
    });
  }

  loadEmployeeData(id: string) {
    this.isLoading = true;
    this.employeeService.findOne(id).subscribe({
        next: (data) => {
            this.employee = data;
            this.isLoading = false;
        },
        error: (err) => {
            this.isLoading = false;
            this.snackBar.open('Failed to load employee details', 'Close', { duration: 3000 });
        }
    });
  }
}


import { Component, OnInit, signal, ViewChild, AfterViewInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SharedModule } from '../../../../../shared/shared.module';
import { debounceTime, distinctUntilChanged, startWith, switchMap, catchError } from 'rxjs/operators';
import { merge, of } from 'rxjs';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../models/employee.model';

interface Branch {
  id: number;
  name: string;
}

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.scss']
})
export class EmployeeListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['employee_id', 'full_name', 'designation', 'branch', 'mobile', 'status', 'actions'];
  dataSource = new MatTableDataSource<Employee>([]);
  resultsLength = 0;
  isLoadingResults = true;
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  searchControl = new FormControl('');
  branchControl = new FormControl(null);
  statusControl = new FormControl(null);

  branches = signal<Branch[]>([]); // TODO: Load from BranchService

  constructor(private employeeService: EmployeeService) {}

  ngOnInit() {
    this.dataSource.filterPredicate = (data: Employee, filter: string) => {
        return data.full_name.toLowerCase().includes(filter) || 
               data.employee_id.toLowerCase().includes(filter);
    };

    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(filterValue => {
          this.applyFilter(filterValue);
      });
  }

  ngAfterViewInit() {
    // Prevent ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
        this.loadData();
    });
  }
  
  loadData() {
      // If sort is used, reset back to first page
      this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);

      merge(this.sort.sortChange, this.paginator.page)
      .pipe(
          startWith({}),
          switchMap(() => {
              this.isLoadingResults = true;
              return this.employeeService.findAll({
                  page: this.paginator.pageIndex + 1,
                  limit: this.paginator.pageSize,
                  // sort: this.sort.active,
                  // order: this.sort.direction,
                  // search: this.searchControl.value
              }).pipe(catchError(() => of([])));
          }),
      ).subscribe(data => {
          this.isLoadingResults = false;
          this.dataSource.data = data;
          this.resultsLength = data.length; // TODO: API should return { data, total }
      });
  }
  
  applyFilter(filterValue: string | null) {
      if(filterValue) {
        this.dataSource.filter = filterValue.trim().toLowerCase();
        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
      } else {
        this.dataSource.filter = '';
      }
  }
}

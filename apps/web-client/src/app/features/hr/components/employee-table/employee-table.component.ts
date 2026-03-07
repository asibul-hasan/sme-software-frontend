import { Component } from '@angular/core';
import { SharedModule } from '../../../../../app/shared/shared.module';
import { TableConfig, ColumnDef, RowData, SqlState } from '../../../../../app/shared/components/data-table/data-table.models';

@Component({
  selector: 'app-employee-table',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './employee-table.component.html',
  styleUrls: ['./employee-table.component.scss']
})
export class EmployeeTableComponent {
  
  tableConfig: TableConfig = {
    uniqueId: 'employee-table',
    allowAdd: true,
    allowDelete: true,
    allowExport: true,
    allowColumnVisibility: true,
    allowRowSelection: true,
    pageSizeOptions: [5, 10, 20]
  };

  columns: ColumnDef[] = [
    { key: 'id', header: 'ID', type: 'text', editable: false }, // ID usually not editable
    { key: 'name', header: 'Name', type: 'text', editable: true },
    { key: 'role', header: 'Role', type: 'text', editable: true },
    { 
        key: 'department', 
        header: 'Department', 
        type: 'select', 
        editable: true,
        options: [
            { label: 'IT', value: 'IT' },
            { label: 'HR', value: 'HR' },
            { label: 'Sales', value: 'Sales' },
            { label: 'Creative', value: 'Creative' }
        ]
    }
  ];

  employees: RowData[] = [
    { sqlState: SqlState.UNCHANGED, id: 1, name: 'John Doe', role: 'Developer', department: 'IT' },
    { sqlState: SqlState.UNCHANGED, id: 2, name: 'Jane Smith', role: 'Designer', department: 'Creative' },
    { sqlState: SqlState.UNCHANGED, id: 3, name: 'Bob Johnson', role: 'Manager', department: 'Sales' },
    { sqlState: SqlState.UNCHANGED, id: 4, name: 'Alice Williams', role: 'HR Specialist', department: 'HR' },
    { sqlState: SqlState.UNCHANGED, id: 5, name: 'Charlie Brown', role: 'Developer', department: 'IT' },
  ];

  onDataChange(data: RowData[]) {
      console.log('Data Changed:', data);
      // Here you would typically determine what changed and call your API
      // const changedRows = data.filter(r => r.sqlState !== SqlState.UNCHANGED);
  }
}

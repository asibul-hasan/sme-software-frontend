import { Component, Input, OnInit, ViewChild, AfterViewInit, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { SelectionModel } from '@angular/cdk/collections';
import { ColumnDef, RowData, SqlState, TableConfig } from './data-table.models';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatMenuModule
  ],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() config: TableConfig = { uniqueId: 'default-table' };
  @Input() columns: ColumnDef[] = [];
  @Input() data: RowData[] = [];

  @Output() dataChange = new EventEmitter<RowData[]>();
  @Output() rowAction = new EventEmitter<{ action: string, row: RowData }>();

  dataSource: MatTableDataSource<RowData>;
  selection = new SelectionModel<RowData>(true, []);
  displayedColumns: string[] = [];
  visibleColumns: ColumnDef[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    this.dataSource = new MatTableDataSource(this.data);
  }

  ngOnInit(): void {
    this.updateDisplayedColumns();
    // Load column visibility preferences if needed
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.dataSource.data = this.data || [];
    }
    if (changes['columns']) {
      this.updateDisplayedColumns();
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  updateDisplayedColumns(): void {
    this.visibleColumns = this.columns.filter(c => !c.hidden);
    this.displayedColumns = this.visibleColumns.map(c => c.key);

    if (this.config.allowRowSelection) {
      this.displayedColumns.unshift('select');
    }
    if (this.config.allowDelete || this.config.allowAdd) { // Basic actions column
       // Check if actions column exists, if not maybe add one?
       // For now, assuming 'actions' is defined in columns if needed or we append it
       if (!this.displayedColumns.includes('actions')) {
           this.displayedColumns.push('actions');
       }
    }
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // --- Row Operations ---

  addRow(): void {
    const newRow: RowData = { sqlState: SqlState.INSERT };
    // Initialize other fields with null/empty
    this.columns.forEach(col => {
        if (col.key !== 'actions' && col.key !== 'select') {
             newRow[col.key] = null;
        }
    });
    
    // Add to data source
    const data = this.dataSource.data;
    data.unshift(newRow); // Add to top
    this.dataSource.data = [...data]; // Refresh
    this.dataChange.emit(this.dataSource.data);
  }

  deleteRow(row: RowData): void {
    if (row.sqlState === SqlState.INSERT) {
      // If it's a new row, just remove it
      this.dataSource.data = this.dataSource.data.filter(r => r !== row);
    } else {
      // Soft delete
      row.sqlState = SqlState.DELETE;
    }
    // Filter out deleted rows from view? User requirement implies managing state, 
    // usually we hide deleted rows or show them strikethrough. 
    // For now, let's keep them and maybe style them or filter them effectively if desired, 
    // but typically users want to see "pending delete". 
    // If requirement says "delete", implies removing from view but tracking state.
    
    // Let's filter them out from the visible datasource but keep in original data? 
    // Complexity: MatTableDataSource uses one array. 
    // If we want to track deleted rows but not show them, we need a separate store.
    
    // Simple approach: Mark as deleted, maybe hide via filter predicate or visual cue.
    // User said "delete option", usually means remove from UI.
    // But they want "change list".
    
    // Let's hide from UI but keep in data?
    // Actually, setting sqlState = 3 IS the tracking.
    // We can filter the dataSource to show only non-deleted?
    // Let's stick to updating state. The UI can choose to hide or show.
    // For this implementation, I will filter them out of the MatTableDataSource rendering pipeline 
    // by using a custom filterPredicate, OR simply remove them from the array 
    // IF we have a separate "tracking" list.
    // Given the constraints, I'll simple remove it from the array if it's INSERT, 
    // if it's existing, I'll mark it DELETE and maybe hide it or show it as deleted.
    // Let's just mark it for now.
    
    this.dataChange.emit(this.dataSource.data);
  }

  onCellEdit(row: RowData, column: ColumnDef, value: any): void {
    row[column.key] = value;
    if (row.sqlState === SqlState.UNCHANGED) {
      row.sqlState = SqlState.UPDATE;
    }
    this.dataChange.emit(this.dataSource.data);
  }
  
  // --- Selection ---

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource.data);
  }

  // --- Export ---
  
  exportToCsv(): void {
    const dataToExport = this.dataSource.data.map(row => {
        const exportRow: any = {};
        this.visibleColumns.forEach(col => {
            if(col.key !== 'actions' && col.key !== 'select') {
                exportRow[col.header] = row[col.key];
            }
        });
        return exportRow;
    });

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${this.config.uniqueId}_export.xlsx`);
  }
  
  // --- Column Visibility ---
  
  toggleColumnVisibility(column: ColumnDef): void {
    if (column.required) return;
    column.hidden = !column.hidden;
    this.updateDisplayedColumns();
  }

  // --- Public API ---

  public getChangedRows(): RowData[] {
    return this.dataSource.data.filter(r => r.sqlState !== SqlState.UNCHANGED);
  }

  public getSelectedRows(): RowData[] {
    return this.selection.selected;
  }

  public getRowCount(): number {
    return this.dataSource.data.length;
  }
  
  public getDataList(): RowData[] {
      return this.dataSource.data;
  }
}

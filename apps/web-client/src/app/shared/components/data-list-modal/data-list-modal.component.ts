import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule } from '@angular/cdk/drag-drop';

export interface ModalColumn {
  field: string;
  label: string;
  pipe?: string; // 'date', 'number', etc.
  pipeArgs?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataListModalConfig {
  title: string;
  columns: ModalColumn[];
  data: any[];
  width?: 'sm' | 'md' | 'lg' | 'xl';
}

@Component({
  selector: 'app-data-list-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatTableModule, MatButtonModule, MatIconModule, DragDropModule],
  template: `
    <div class="data-list-modal d-flex flex-column" cdkDrag cdkDragRootElement=".cdk-overlay-pane">
      <!-- Modal Header (Drag Handle) -->
      <div 
        class="modal-header d-flex justify-content-between align-items-center p-3 border-bottom bg-light" 
        cdkDragHandle
        style="cursor: move;"
      >
        <h5 class="m-0 fw-bold d-flex align-items-center gap-2">
          <mat-icon color="primary">list_alt</mat-icon>
          {{ data.title }}
        </h5>
        <button mat-icon-button (click)="onClose()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Modal Body (Table) -->
      <div class="modal-body p-0 overflow-auto" style="max-height: 60vh;">
        <table mat-table [dataSource]="data.data" class="w-100 custom-modal-table">
          <ng-container *ngFor="let col of data.columns" [matColumnDef]="col.field">
            <th mat-header-cell *matHeaderCellDef [class.text-end]="col.align === 'right'" [class.text-center]="col.align === 'center'">
              {{ col.label }}
            </th>
            <td mat-cell *matCellDef="let row" [class.text-end]="col.align === 'right'" [class.text-center]="col.align === 'center'">
              <ng-container [ngSwitch]="col.pipe">
                <span *ngSwitchCase="'date'">{{ row[col.field] | date: (col.pipeArgs || 'mediumDate') }}</span>
                <span *ngSwitchCase="'number'">{{ row[col.field] | number: (col.pipeArgs || '1.2-2') }}</span>
                <span *ngSwitchCase="'currency'">{{ row[col.field] | currency: (col.pipeArgs || 'USD') }}</span>
                <span *ngSwitchDefault>{{ row[col.field] }}</span>
              </ng-container>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="row-hover"></tr>

          <!-- No Data Message -->
          <tr *matNoDataRow>
            <td [attr.colspan]="displayedColumns.length" class="text-center py-5 text-secondary opacity-50">
              <mat-icon style="font-size: 48px; width: 48px; height: 48px">inventory_2</mat-icon>
              <p class="m-0">No data available for this view.</p>
            </td>
          </tr>
        </table>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer p-3 border-top d-flex justify-content-end bg-light">
        <button mat-stroked-button (click)="onClose()">Close</button>
      </div>
    </div>
  `,
  styles: [`
    .data-list-modal {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    .custom-modal-table th {
      background-color: #f8f9fa !important;
      font-weight: 700;
      color: #495057;
      white-space: nowrap;
    }
    .row-hover:hover {
      background-color: #f1f3f5;
    }
    .close-btn {
      margin: -12px;
    }
  `]
})
export class DataListModalComponent {
  displayedColumns: string[];

  constructor(
    public dialogRef: MatDialogRef<DataListModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DataListModalConfig
  ) {
    this.displayedColumns = this.data.columns.map(c => c.field);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}

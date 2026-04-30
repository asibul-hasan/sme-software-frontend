import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'primary' | 'warn' | 'danger';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <div class="dialog-header p-3 border-bottom d-flex align-items-center gap-2">
        <mat-icon [color]="data.type === 'warn' || data.type === 'danger' ? 'warn' : 'primary'">
          {{ data.type === 'danger' ? 'report_problem' : 'help_outline' }}
        </mat-icon>
        <h5 class="m-0 fw-bold">{{ data.title || 'Confirmation' }}</h5>
      </div>
      <div class="dialog-body p-4">
        <p class="m-0 text-secondary">{{ data.message }}</p>
      </div>
      <div class="dialog-actions p-3 border-top d-flex justify-content-end gap-2">
        <button mat-button (click)="onCancel()">{{ data.cancelText || 'Cancel' }}</button>
        <button 
          mat-raised-button 
          [color]="data.type === 'warn' || data.type === 'danger' ? 'warn' : 'primary'"
          (click)="onConfirm()"
        >
          {{ data.confirmText || 'Confirm' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      min-width: 350px;
      max-width: 500px;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

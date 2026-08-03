import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog custom-dialog">
      <div class="dialog-header d-flex justify-content-between align-items-center px-4 py-3" [ngClass]="data.type || 'primary'">
        <h4 class="dialog-title m-0 fw-bold text-white">{{ data.title || 'Confirmation' }}</h4>
        <mat-icon class="close-icon text-white cursor-pointer" (click)="onCancel()">close</mat-icon>
      </div>
      <div class="dialog-body px-4 py-4">
        <p class="dialog-message m-0">{{ data.message }}</p>
      </div>
      <div class="dialog-actions d-flex justify-content-end px-4 py-3 gap-2">
        <button class="btn-cancel" (click)="onCancel()">{{ data.cancelText || 'Cancel' }}</button>
        <button 
          class="btn-confirm"
          [ngClass]="data.type || 'primary'"
          (click)="onConfirm()"
        >
          {{ data.confirmText || 'Confirm' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .custom-dialog {
      min-width: 480px;
      max-width: 500px;
      background-color: #ffffff;
      border-radius: 4px;
      overflow: hidden;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    }
    
    .dialog-header {
      /* The background color is determined by the ngClass */
    }
    
    .dialog-header.danger {
      background-color: #dc3545;
    }
    
    .dialog-header.warn {
      background-color: #f59e0b;
    }
    
    .dialog-header.primary {
      background-color: #0d6efd;
    }
    
    .dialog-title {
      font-size: 1.25rem;
      letter-spacing: 0;
    }
    
    .close-icon {
      opacity: 0.8;
    }
    
    .close-icon:hover {
      opacity: 1;
    }
    
    .cursor-pointer {
      cursor: pointer;
    }
    
    .dialog-message {
      font-size: 1.05rem;
      color: #333333;
      line-height: 1.5;
    }
    
    .dialog-actions {
      border-top: 1px solid #e0e0e0;
      background-color: #ffffff;
    }
    
    .btn-cancel {
      background-color: #6c757d;
      border: none;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      font-size: 1rem;
      padding: 8px 18px;
      cursor: pointer;
    }
    
    .btn-cancel:hover {
      background-color: #5a6268;
    }
    
    .btn-confirm {
      border: none;
      border-radius: 6px;
      font-weight: 500;
      font-size: 1rem;
      padding: 8px 20px;
      cursor: pointer;
    }
    
    .btn-confirm.danger {
      background-color: #dc3545;
      color: white;
    }
    
    .btn-confirm.warn {
      background-color: #f59e0b;
      color: white;
    }
    
    .btn-confirm.primary {
      background-color: #0d6efd;
      color: white;
    }
    
    .btn-confirm:hover {
      filter: brightness(0.9);
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

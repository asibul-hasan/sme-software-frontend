import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private dialog = inject(MatDialog);

  /**
   * Shows a confirmation dialog.
   * @param message The message to display
   * @param title The dialog title
   * @param type The style of the confirm button
   */
  confirm(message: string, title: string = 'Confirm Action', type: 'primary' | 'warn' | 'danger' = 'primary'): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title,
        message,
        type,
        confirmText: 'Yes, Proceed',
        cancelText: 'Cancel'
      },
      disableClose: true
    });

    return dialogRef.afterClosed();
  }

  /**
   * Specialized confirmation for delete operations.
   */
  deleteConfirm(message: string = 'Are you sure you want to delete this record? This action cannot be undone.'): Observable<boolean> {
    return this.confirm(message, 'Delete Confirmation', 'danger');
  }
}

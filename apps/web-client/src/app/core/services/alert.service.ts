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
  confirm(
    message: string, 
    title: string = 'Confirm Action', 
    type: 'primary' | 'warn' | 'danger' = 'primary',
    confirmText: string = 'Confirm'
  ): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title,
        message,
        type,
        confirmText,
        cancelText: 'Cancel'
      },
      panelClass: 'custom-dialog-panel',
      disableClose: true
    });

    return dialogRef.afterClosed();
  }

  /**
   * Specialized confirmation for delete operations.
   */
  deleteConfirm(message: string = 'Are you sure to delete this record?'): Observable<boolean> {
    return this.confirm(message, 'Delete Record', 'danger', 'Delete');
  }
}

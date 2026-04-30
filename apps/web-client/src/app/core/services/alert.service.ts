import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private dialog = inject(MatDialog);
  private toastr = inject(ToastrService);

  success(message: string, title: string = 'Success'): void {
    this.toastr.success(message, title);
  }

  error(message: string, title: string = 'Error'): void {
    this.toastr.error(message, title);
  }

  warning(message: string, title: string = 'Warning'): void {
    this.toastr.warning(message, title);
  }

  info(message: string, title: string = 'Info'): void {
    this.toastr.info(message, title);
  }

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

  deleteConfirm(message: string = 'Are you sure you want to delete this record? This action cannot be undone.'): Observable<boolean> {
    return this.confirm(message, 'Delete Confirmation', 'danger');
  }
}

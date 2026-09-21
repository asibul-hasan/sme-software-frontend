import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
  ConfirmDialogVariant,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';

export interface AlertOptions {
  title?: string;
  confirmText?: string;
}

/**
 * Central UX service for confirmations and alert dialogs.
 *
 * Everything renders through the shared Tailwind-styled `ConfirmDialogComponent`
 * inside a MatDialog so overlay/backdrop/z-index/focus are managed by CDK. The
 * alert-dialog panel class boosts z-index above other open MatDialogs so an
 * alert opened from within a modal still floats on top.
 */
@Injectable({
  providedIn: 'root',
})
export class AlertService {
  private dialog = inject(MatDialog);

  /** Yes/No confirmation. */
  confirm(
    message: string,
    title: string = 'Confirm Action',
    type: ConfirmDialogVariant = 'primary',
    confirmText: string = 'Confirm',
  ): Observable<boolean> {
    return this.open({
      title,
      message,
      type,
      confirmText,
      cancelText: 'Cancel',
      showCancel: true,
    });
  }

  /** Specialised confirmation for delete operations. */
  deleteConfirm(
    message: string = 'Are you sure to delete this record?',
  ): Observable<boolean> {
    return this.confirm(message, 'Delete Record', 'danger', 'Delete');
  }

  success(message: string, opts: AlertOptions = {}): Observable<boolean> {
    return this.alert(message, 'success', opts);
  }

  warning(message: string, opts: AlertOptions = {}): Observable<boolean> {
    return this.alert(message, 'warn', opts);
  }

  danger(message: string, opts: AlertOptions = {}): Observable<boolean> {
    return this.alert(message, 'danger', opts);
  }

  info(message: string, opts: AlertOptions = {}): Observable<boolean> {
    return this.alert(message, 'info', opts);
  }

  /** Generic single-button alert (OK). */
  alert(
    message: string,
    type: ConfirmDialogVariant = 'info',
    opts: AlertOptions = {},
  ): Observable<boolean> {
    return this.open({
      title: opts.title ?? this.defaultTitle(type),
      message,
      type,
      confirmText: opts.confirmText ?? 'OK',
      showCancel: false,
    });
  }

  /** Full dialog escape hatch — pass a complete ConfirmDialogData. */
  create(data: ConfirmDialogData): Observable<boolean> {
    return this.open(data);
  }

  private open(data: ConfirmDialogData): Observable<boolean> {
    return this.dialog
      .open(ConfirmDialogComponent, {
        width: '480px',
        maxWidth: '92vw',
        data,
        panelClass: ['custom-dialog-panel', 'alert-dialog-panel'],
        disableClose: true,
        autoFocus: false,
      })
      .afterClosed();
  }

  private defaultTitle(type: ConfirmDialogVariant): string {
    switch (type) {
      case 'success':
        return 'Success';
      case 'warn':
        return 'Warning';
      case 'danger':
        return 'Error';
      case 'info':
        return 'Information';
      default:
        return 'Notice';
    }
  }
}

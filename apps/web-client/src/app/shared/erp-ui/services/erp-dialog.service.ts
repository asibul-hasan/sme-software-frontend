import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationModalComponent } from '../../components/confirmation-modal/confirmation-modal.component';

@Injectable({ providedIn: 'root' })
export class ErpDialogService {
  private dialog = inject(MatDialog);

  confirmDelete(entityName = 'record'): Promise<boolean> {
    return new Promise((resolve) => {
      const dialogRef = this.dialog.open(ConfirmationModalComponent, {
        width: '400px',
        data: {
          title: 'Confirm Delete',
          message: `Are you sure you want to delete this ${entityName}? This action cannot be undone.`,
          confirmText: 'Delete',
          confirmColor: 'warn',
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        resolve(!!result);
      });
    });
  }

  confirmApproval(entityName = 'document'): Promise<boolean> {
    return new Promise((resolve) => {
      const dialogRef = this.dialog.open(ConfirmationModalComponent, {
        width: '400px',
        data: {
          title: 'Confirm Approval',
          message: `Are you sure you want to approve this ${entityName}?`,
          confirmText: 'Approve',
          confirmColor: 'primary',
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        resolve(!!result);
      });
    });
  }
}

import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DataListModalComponent, DataListModalConfig } from '../../shared/components/data-list-modal/data-list-modal.component';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private dialog = inject(MatDialog);

  /**
   * Opens a generic data list modal with configurable columns and data.
   */
  openDataList(config: DataListModalConfig): MatDialogRef<DataListModalComponent> {
    const widthMap = {
      'sm': '400px',
      'md': '650px',
      'lg': '900px',
      'xl': '1200px'
    };

    return this.dialog.open(DataListModalComponent, {
      width: widthMap[config.width || 'md'],
      data: config,
      panelClass: 'draggable-modal-pane',
      disableClose: false,
      autoFocus: false
    });
  }
}

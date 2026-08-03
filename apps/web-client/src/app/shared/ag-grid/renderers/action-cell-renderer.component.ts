import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ErpDialogService } from '../../erp-ui/services/erp-dialog.service';

@Component({
  selector: 'app-action-cell-renderer',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    @if (!isPinned) {
      <div class="d-flex align-items-center justify-content-center h-100">
        <button
          type="button"
          class="btn btn-sm p-0 text-danger border-0"
          (click)="onDelete($event)"
          title="Delete Row"
        >
          <mat-icon style="font-size:16px; width:16px; height:16px">delete</mat-icon>
        </button>
      </div>
    }
  `,
  styles: [`
    :host { display: block; height: 100%; }
  `]
})
export class ActionCellRendererComponent implements ICellRendererAngularComp {
  private dialogService = inject(ErpDialogService);
  private params: any;
  /** The pinned totals row is a summary, not a record — it gets no row actions. */
  protected isPinned = false;

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.isPinned = !!params.node?.rowPinned;
  }

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    this.isPinned = !!params.node?.rowPinned;
    return true;
  }

  async onDelete(event: MouseEvent): Promise<void> {
    event.stopPropagation();
    if (this.params.context?.gridApiService && this.params.data?.__uid) {
      const confirm = await this.dialogService.confirmDelete('row item');
      if (confirm) {
        this.params.context.gridApiService.deleteRow(this.params.data.__uid);
      }
    }
  }

}

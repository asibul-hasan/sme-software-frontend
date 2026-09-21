import { Injectable, inject } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private readonly nzModal = inject(NzModalService);

  confirmDelete(entityName: string, detail?: string): Observable<boolean> {
    return new Observable<boolean>(observer => {
      this.nzModal.confirm({
        nzTitle: `Delete ${entityName}?`,
        nzContent: detail || `Are you sure you want to permanently delete this ${entityName.toLowerCase()}? This action cannot be undone.`,
        nzOkText: 'Delete',
        nzOkType: 'primary',
        nzOkDanger: true,
        nzCancelText: 'Cancel',
        nzOnOk: () => {
          setTimeout(() => {
            observer.next(true);
            observer.complete();
          }, 0);
        },
        nzOnCancel: () => {
          setTimeout(() => {
            observer.next(false);
            observer.complete();
          }, 0);
        },
      });
    });
  }

  confirmAction(title: string, content: string, okText = 'Confirm', okDanger = false): Observable<boolean> {
    return new Observable<boolean>(observer => {
      this.nzModal.confirm({
        nzTitle: title,
        nzContent: content,
        nzOkText: okText,
        nzOkType: 'primary',
        nzOkDanger: okDanger,
        nzCancelText: 'Cancel',
        nzOnOk: () => {
          setTimeout(() => {
            observer.next(true);
            observer.complete();
          }, 0);
        },
        nzOnCancel: () => {
          setTimeout(() => {
            observer.next(false);
            observer.complete();
          }, 0);
        },
      });
    });
  }
}

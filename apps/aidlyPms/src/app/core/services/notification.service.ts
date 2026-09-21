import { Injectable, inject } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly nzNotification = inject(NzNotificationService);
  private readonly nzMessage = inject(NzMessageService);

  success(title: string, content?: string): void {
    if (content) {
      this.nzNotification.success(title, content, { nzPlacement: 'bottomRight' });
    } else {
      this.nzMessage.success(title);
    }
  }

  error(title: string, content?: string): void {
    if (content) {
      this.nzNotification.error(title, content, { nzPlacement: 'bottomRight', nzDuration: 6000 });
    } else {
      this.nzMessage.error(title, { nzDuration: 6000 });
    }
  }

  warning(title: string, content?: string): void {
    if (content) {
      this.nzNotification.warning(title, content, { nzPlacement: 'bottomRight' });
    } else {
      this.nzMessage.warning(title);
    }
  }

  info(title: string, content?: string): void {
    if (content) {
      this.nzNotification.info(title, content, { nzPlacement: 'bottomRight' });
    } else {
      this.nzMessage.info(title);
    }
  }
}

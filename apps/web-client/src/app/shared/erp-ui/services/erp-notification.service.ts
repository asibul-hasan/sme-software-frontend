import { Injectable, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({ providedIn: 'root' })
export class ErpNotificationService {
  private toastr = inject(ToastrService);

  success(message: string, title = 'Success'): void {
    this.toastr.success(message, title);
  }

  warning(message: string, title = 'Warning'): void {
    this.toastr.warning(message, title);
  }

  error(message: string, title = 'Error'): void {
    this.toastr.error(message, title);
  }

  info(message: string, title = 'Information'): void {
    this.toastr.info(message, title);
  }
}

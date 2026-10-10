import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';

export const managerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const msg = inject(NzMessageService);

  if (authService.isManager()) {
    return true;
  }

  msg.warning('Access denied: Staff / Cashier role is restricted from viewing administrative, accounting, and configuration screens.');
  router.navigate(['/customer/sale']);
  return false;
};

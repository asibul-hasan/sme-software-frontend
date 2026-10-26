import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';

export const menuGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const msg = inject(NzMessageService);

  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  const menuCode = route.data?.['menuCode'] as string | undefined;
  if (!menuCode) {
    return true;
  }

  if (authService.hasMenuAccess(menuCode, 'view')) {
    return true;
  }

  msg.warning('Access denied: You do not have permission to view this screen.');
  let fallbackRoute = authService.firstAllowedRoute();
  const currentPath = '/' + route.pathFromRoot
    .map((r) => r.url.map((u) => u.path).join('/'))
    .filter(Boolean)
    .join('/');

  if (fallbackRoute === currentPath) {
    fallbackRoute = '/auth/login';
  }

  router.navigate([fallbackRoute]);
  return false;
};

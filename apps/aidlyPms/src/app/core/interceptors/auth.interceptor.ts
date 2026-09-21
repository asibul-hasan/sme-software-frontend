import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();
  const branch = authService.activeBranch();

  let headers = req.headers;

  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  if (branch) {
    headers = headers.set('X-Pharmacy-No', String(branch.pharmacy_no));
  }

  const cloned = req.clone({ headers });
  return next(cloned);
};

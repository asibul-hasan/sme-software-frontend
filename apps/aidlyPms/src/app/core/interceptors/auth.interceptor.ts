import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();

  let headers = req.headers;

  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  const cloned = req.clone({ headers });
  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 403) {
        authService.refreshUserAccess().subscribe({
          error: (refreshErr) => console.warn('Failed to refresh user access after 403:', refreshErr),
        });
      }
      return throwError(() => error);
    })
  );
};

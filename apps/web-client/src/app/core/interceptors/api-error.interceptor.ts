import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

/**
 * Global HTTP error interceptor (functional).
 *
 * For every 4xx / 5xx response it extracts the `message` field from the
 * backend ApiResponse envelope and shows it as a toastr error.
 * 401 is intentionally skipped — auth.interceptor owns that lifecycle
 * (token refresh → logout).
 */
export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        const body = error.error;
        const message =
          (typeof body === 'object' && body?.message) ||
          error.message ||
          'An unexpected error occurred.';
        toastr.error(message);
      }
      return throwError(() => error);
    }),
  );
};

import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler,
  HttpEvent, HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

/**
 * Global HTTP error interceptor.
 *
 * For every 4xx / 5xx response it extracts the `message` field from the
 * backend ApiResponse envelope and shows it as a toastr error.
 * 401 is intentionally skipped — AuthInterceptor owns that lifecycle
 * (token refresh → logout).
 */
@Injectable()
export class ApiErrorInterceptor implements HttpInterceptor {
  private readonly toastr = inject(ToastrService);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status !== 401) {
          const body = error.error;
          const message =
            (typeof body === 'object' && body?.message) ||
            error.message ||
            'An unexpected error occurred.';
          this.toastr.error(message);
        }
        return throwError(() => error);
      }),
    );
  }
}

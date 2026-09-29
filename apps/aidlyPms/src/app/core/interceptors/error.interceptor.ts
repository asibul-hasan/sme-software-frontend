import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../auth/auth.service';
import { BackendDiscoveryService } from '../services/backend-discovery.service';

/**
 * Token to suppress the automatic global error notification toast.
 * Useful for services that provide their own offline/fallback handling or mock data.
 */
export const SKIP_ERROR_NOTIFICATION = new HttpContextToken<boolean>(() => false);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NotificationService);
  const auth = inject(AuthService);
  const discovery = inject(BackendDiscoveryService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // If caller requested silent error handling (e.g. offline fallback), skip notification
      if (req.context.get(SKIP_ERROR_NOTIFICATION)) {
        return throwError(() => error);
      }

      let errorMessage = 'An unexpected server error occurred.';

      if (error.status === 0) {
        discovery.handleConnectionFailure(req.url);
        errorMessage = 'Unable to reach local backend server. Traffic is automatically rerouted to Hugging Face cloud live.';
      } else if (error.error && typeof error.error === 'object' && 'message' in error.error) {
        errorMessage = error.error.message;
      } else if (error.status === 401) {
        errorMessage = 'Session expired or unauthorized. Please log in again.';
        auth.logout();
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      } else if (error.status === 404) {
        errorMessage = 'The requested resource was not found (404).';
      } else if (error.status >= 500) {
        errorMessage = 'Internal server error. Please contact technical support.';
      }

      notification.error('Operation Failed', errorMessage);
      return throwError(() => error);
    })
  );
};

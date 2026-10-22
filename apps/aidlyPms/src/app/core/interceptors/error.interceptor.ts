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

      let errorTitle = 'Operation Failed';
      let errorMessage = 'An unexpected server error occurred.';

      if (error.status === 0) {
        discovery.handleConnectionFailure(req.url);
        errorTitle = 'Connection Error';
        errorMessage = 'Unable to reach backend server. Please verify your connection or ensure backend service is running.';
      } else if (error.error) {
        if (typeof error.error === 'string') {
          const trimmed = error.error.trim();
          if (!trimmed.startsWith('<!DOCTYPE') && !trimmed.startsWith('<html')) {
            errorMessage = trimmed;
          }
        } else if (typeof error.error === 'object') {
          const errObj = error.error as Record<string, any>;
          if (errObj['message']) {
            errorMessage = String(errObj['message']);
          } else if (errObj['detail']) {
            errorMessage = String(errObj['detail']);
          } else if (errObj['errors'] && typeof errObj['errors'] === 'object') {
            // ASP.NET ValidationProblemDetails
            const validationList: string[] = [];
            for (const key of Object.keys(errObj['errors'])) {
              const val = errObj['errors'][key];
              if (Array.isArray(val)) {
                validationList.push(...val);
              } else if (typeof val === 'string') {
                validationList.push(val);
              }
            }
            if (validationList.length > 0) {
              errorMessage = validationList.join(' · ');
              errorTitle = 'Validation Failed';
            } else if (errObj['title']) {
              errorMessage = String(errObj['title']);
            }
          } else if (errObj['title']) {
            errorMessage = String(errObj['title']);
          } else if (errObj['error']) {
            errorMessage = String(errObj['error']);
          }
        }
      }

      if (error.status === 400 || error.status === 422) {
        if (errorTitle === 'Operation Failed') errorTitle = 'Invalid Request';
      } else if (error.status === 401) {
        errorTitle = 'Authentication Required';
        errorMessage = errorMessage !== 'An unexpected server error occurred.' ? errorMessage : 'Session expired or unauthorized. Please log in again.';
        auth.logout();
      } else if (error.status === 402) {
        errorTitle = 'Subscription Required';
        errorMessage = errorMessage !== 'An unexpected server error occurred.' ? errorMessage : 'Subscription payment required or grace period expired. Please renew your pharmacy plan.';
      } else if (error.status === 403) {
        errorTitle = 'Access Denied';
        errorMessage = errorMessage !== 'An unexpected server error occurred.' ? errorMessage : 'You do not have permission to perform this action.';
      } else if (error.status === 404) {
        errorTitle = 'Not Found';
        errorMessage = errorMessage !== 'An unexpected server error occurred.' ? errorMessage : 'The requested resource was not found (404).';
      } else if (error.status === 409) {
        errorTitle = 'Conflict';
        errorMessage = errorMessage !== 'An unexpected server error occurred.' ? errorMessage : 'A conflict occurred. The record may already exist or has been modified.';
      } else if (error.status >= 500) {
        errorTitle = 'Server Error';
        errorMessage = errorMessage !== 'An unexpected server error occurred.' ? errorMessage : 'Internal server error. Please contact technical support.';
      }

      notification.error(errorTitle, errorMessage);
      return throwError(() => error);
    })
  );
};

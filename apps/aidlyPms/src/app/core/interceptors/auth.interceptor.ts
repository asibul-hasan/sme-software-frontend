import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap } from 'rxjs';
import { BrowserSessionService } from '../auth/browser-session.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(BrowserSessionService);
  // Never attach application credentials to third-party requests.
  if (!session.isApiRequest(req.url)) return next(req);
  const browserRequest = req.clone({ withCredentials: true });
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase())) return next(browserRequest);
  return session.csrfToken().pipe(
    switchMap(csrf => next(browserRequest.clone({ setHeaders: { 'X-CSRF-TOKEN': csrf } })))
  );
};
